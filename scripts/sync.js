(function () {
    // ── Constants ──
    var PROTOCOL_VERSION = 1;
    var SENDER_TIMEOUT_MS = 30000;
    var RECEIVER_TIMEOUT_MS = 60000;
    var MAX_MSG_LENGTH = 480;

    // ── Connection State ──
    var connectedPlayers = {};   // clientId → { clientId, playerId, playerName }
    var myClient = null;         // own clientFragment (from TS.clients.whoAmI)
    var myPlayer = null;         // own playerFragment (from TS.players.whoAmI)

    // ── Transaction Tracking ──
    var pendingOutgoing = {};    // txnId → { targetClient, mode, src, moduleId, itemId, timestamp, state }
    var pendingIncoming = {};    // txnId → { fromClient, fromName, mode, src, data, meta, receivedAt }

    // ── Initialization ──
    var _sweepInterval = null;

    function initSync() {
        if (_sweepInterval !== null) return;
        if (typeof TS === 'undefined') return;
        Promise.all([
            TS.clients.whoAmI(),
            TS.players.whoAmI()
        ]).then(function (results) {
            myClient = results[0];
            myPlayer = results[1];
            return TS.sync.getClientsConnected();
        }).then(function (clients) {
            if (clients && clients.cause) {
                console.error('[CV Sync] getClientsConnected failed:', clients.cause);
                return;
            }
            (clients || []).forEach(function (client) {
                if (!myClient || client.id === myClient.id) return;
                addConnectedClient(client);
            });
            updateConnectionIndicator();
        }).catch(function (err) {
            console.error('[CV Sync] initSync error:', err);
        });
        _sweepInterval = setInterval(sweepTimeouts, 5000);
    }

    function addConnectedClient(clientFragment) {
        var cid = clientFragment.id;
        if (connectedPlayers[cid]) return;
        connectedPlayers[cid] = {
            clientId: cid,
            playerId: clientFragment.player ? clientFragment.player.id : null,
            playerName: clientFragment.player ? clientFragment.player.name : 'Unknown'
        };
    }

    // ── Manifest Handlers ──

    window.handleSyncMessage = function (event) {
        var msg;
        try {
            msg = JSON.parse(event.payload.str);
        } catch (e) {
            console.warn('[CV Sync] Malformed message received');
            return;
        }
        if (!msg || !msg.t) return;
        var fromClientId = event.payload.fromClient ? event.payload.fromClient.id : null;
        switch (msg.t) {
            case 'offer':   handleOffer(msg, fromClientId); break;
            case 'accept':  resolveOutgoing(msg.txn, 'transfer.accepted', true); break;
            case 'decline': resolveOutgoing(msg.txn, 'transfer.declined', false); break;
            case 'cancel':  handleCancel(msg); break;
            case 'ping':    handlePing(fromClientId); break;
            case 'pong':    break;
            default:
                console.warn('[CV Sync] Unknown message type:', msg.t);
        }
    };

    // sync.onClientEvent — fires when a client opens/closes CV (same interop ID)
    window.handleSyncClientEvent = function (event) {
        if (event.kind === 'clientConnected') {
            var client = event.payload.client;
            if (!client) return;
            TS.clients.isMe(client.id).then(function (isMe) {
                if (isMe) return;
                addConnectedClient(client);
                updateConnectionIndicator();
                var name = (connectedPlayers[client.id] || {}).playerName || 'Unknown';
                window.showToast(window.t('transfer.connected', { name: name }), 'info');
            }).catch(console.error);
        } else if (event.kind === 'clientDisconnected') {
            var clientId = event.payload.clientId;
            var name = (connectedPlayers[clientId] || {}).playerName || 'Unknown';
            delete connectedPlayers[clientId];
            updateConnectionIndicator();
            window.showToast(window.t('transfer.disconnected', { name: name }), 'info');
            // A disconnected peer can no longer respond; cancel to unblock the sender.
            Object.keys(pendingOutgoing).forEach(function (txnId) {
                if (pendingOutgoing[txnId].targetClient === clientId) {
                    clearPendingOutgoing(txnId);
                    window.showToast(window.t('transfer.cancelled'), 'info');
                }
            });
        }
    };

    // clients.onClientEvent — board-level events (join/leave/mode change)
    window.handleClientEvent = function (event) {};

    // ── Protocol Handlers ──

    function handleOffer(msg, fromClientId) {
        if (!msg.txn) return;
        pendingIncoming[msg.txn] = {
            fromClient: fromClientId,
            fromName: msg.from || 'Unknown',
            mode: msg.mode || 'move',
            src: msg.src,
            data: msg.data,
            meta: msg.meta,
            receivedAt: Date.now()
        };
        console.log('[CV Sync] Offer received txn:', msg.txn, 'from:', msg.from);
    }

    function resolveOutgoing(txnId, toastKey, removeItem) {
        var txn = pendingOutgoing[txnId];
        if (!txn) return;
        if (removeItem && txn.mode !== 'copy') removeTransferredItem(txn);
        var name = (connectedPlayers[txn.targetClient] || {}).playerName || 'Player';
        window.showToast(window.t(toastKey, { name: name }), 'info');
        clearPendingOutgoing(txnId);
    }

    function handleCancel(msg) {
        var incoming = pendingIncoming[msg.txn];
        if (!incoming) return;
        window.showToast(window.t('transfer.cancelledBy', { name: incoming.fromName }), 'info');
        delete pendingIncoming[msg.txn];
    }

    function handlePing(fromClientId) {
        if (!fromClientId) return;
        TS.sync.send(JSON.stringify({ v: PROTOCOL_VERSION, t: 'pong' }), fromClientId).catch(console.error);
    }

    // ── Send Helpers ──

    function sendMessage(type, targetClient, extraFields) {
        if (!myPlayer || !myClient) return;
        var msg = Object.assign({
            v: PROTOCOL_VERSION,
            t: type,
            from: myPlayer.name,
            fromClient: myClient.id
        }, extraFields || {});
        var json = JSON.stringify(msg);
        if (json.length > MAX_MSG_LENGTH) {
            console.warn('[CV Sync] Message near limit (' + json.length + ' chars), type:', type);
        }
        TS.sync.send(json, targetClient).catch(console.error);
    }

    function generateTxnId() {
        var chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        var suffix = '';
        for (var i = 0; i < 3; i++) suffix += chars[Math.floor(Math.random() * chars.length)];
        return 'txn_' + Date.now() + '_' + suffix;
    }

    // ── Pending State ──

    function clearPendingOutgoing(txnId) {
        var txn = pendingOutgoing[txnId];
        if (txn) removePendingUIState(txn);
        delete pendingOutgoing[txnId];
    }

    function removePendingUIState(txn) {
        if (!txn.moduleId || !txn.itemId) return;
        var row = document.querySelector('[data-id="' + txn.moduleId + '"] [data-item-id="' + txn.itemId + '"]');
        if (row) row.classList.remove('list-item-pending');
    }

    function removeTransferredItem(txn) {
        var mod = (window.modules || []).find(function (m) { return m.id === txn.moduleId; });
        if (!mod || !mod.content || !mod.content.items) return;
        var idx = mod.content.items.findIndex(function (it) { return it.id === txn.itemId; });
        if (idx !== -1) {
            mod.content.items.splice(idx, 1);
            window.scheduleSave();
        }
    }

    // ── Timeout Sweep ──

    function sweepTimeouts() {
        if (!Object.keys(pendingOutgoing).length && !Object.keys(pendingIncoming).length) return;
        var now = Date.now();
        Object.keys(pendingOutgoing).forEach(function (txnId) {
            var txn = pendingOutgoing[txnId];
            if (txn.state === 'pending' && now - txn.timestamp > SENDER_TIMEOUT_MS) {
                sendMessage('cancel', txn.targetClient, { txn: txnId });
                window.showToast(window.t('transfer.timedOut'), 'info');
                clearPendingOutgoing(txnId);
            }
        });
        Object.keys(pendingIncoming).forEach(function (txnId) {
            var incoming = pendingIncoming[txnId];
            if (now - incoming.receivedAt > RECEIVER_TIMEOUT_MS) {
                sendMessage('decline', incoming.fromClient, { txn: txnId });
                delete pendingIncoming[txnId];
            }
        });
    }

    // ── Connection Indicator ──

    function updateConnectionIndicator() {
        var indicator = document.getElementById('sync-indicator');
        var countEl = document.getElementById('sync-count');
        if (!indicator || !countEl) return;
        var count = Object.keys(connectedPlayers).length;
        if (count > 0) {
            countEl.textContent = String(count);
            indicator.style.display = '';
        } else {
            indicator.style.display = 'none';
        }
    }

    // ── Compact Format (pure — exposed on window for vitest) ──

    function compactForTransfer(item, sourceType, moduleData) {
        if (sourceType === 'list') return compactListItem(item, moduleData);
        return Object.assign({}, item);
    }

    function compactListItem(item, moduleData) {
        var compact = {};
        if (item.name) compact.name = item.name;

        var attrs = (moduleData && moduleData.attrs) ? moduleData.attrs : [];
        var idToName = {};
        attrs.forEach(function (attr) { idToName[attr.id] = attr.name; });

        if (item.values && typeof item.values === 'object') {
            var compactValues = {};
            Object.keys(item.values).forEach(function (attrId) {
                var val = item.values[attrId];
                if (val === null || val === undefined || val === '' || val === false || val === 0) return;
                compactValues[idToName[attrId] || attrId] = val;
            });
            if (Object.keys(compactValues).length > 0) compact.values = compactValues;
        }
        return compact;
    }

    function expandReceived(compact, sourceType) {
        if (sourceType === 'list') return expandListItem(compact);
        return Object.assign({}, compact);
    }

    function expandListItem(compact) {
        return {
            id: generateLocalId(),
            name: compact.name || '',
            values: compact.values ? Object.assign({}, compact.values) : {}
        };
    }

    function generateLocalId() {
        return 'item_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
    }

    function validateIncoming(msg) {
        if (!msg || typeof msg !== 'object') return false;
        if (msg.v === undefined || msg.v === null) return false;
        if (!msg.t || typeof msg.t !== 'string') return false;
        if (!msg.txn || typeof msg.txn !== 'string') return false;
        if (msg.from && typeof msg.from === 'string') msg.from = window.escapeHtml(msg.from);
        if (msg.data && typeof msg.data === 'object') sanitizeObject(msg.data);
        return true;
    }

    function sanitizeObject(obj) {
        if (!obj || typeof obj !== 'object') return;
        Object.keys(obj).forEach(function (key) {
            if (typeof obj[key] === 'string') obj[key] = window.escapeHtml(obj[key]);
            else if (obj[key] && typeof obj[key] === 'object') sanitizeObject(obj[key]);
        });
    }

    // ── Public API ──
    window.initSync = initSync;
    window.getConnectedPlayers = function () { return Object.values(connectedPlayers); };

    // Pure helpers exposed for vitest (rule 19)
    window.compactForTransfer = compactForTransfer;
    window.expandReceived = expandReceived;
    window.validateIncoming = validateIncoming;
    window.generateTxnId = generateTxnId;
})();
