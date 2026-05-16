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
        var row = document.querySelector('[data-module-id="' + txn.moduleId + '"][data-item-id="' + txn.itemId + '"]');
        if (!row) return;
        row.classList.remove('list-item-pending');
        var cancelBtn = row.querySelector('.list-item-cancel-btn');
        if (cancelBtn) cancelBtn.remove();
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

    // ── Player Picker Modal ──

    function openSendToPlayerModal(itemData, srcType, moduleMeta, moduleId, itemId) {
        if (typeof TS === 'undefined') return;

        var existing = document.querySelector('.transfer-player-overlay');
        if (existing) existing.remove();

        var players = window.getConnectedPlayers();
        var hasPlayers = players.length > 0;
        var itemName = (itemData && itemData.name) ? itemData.name : '';

        var overlay = document.createElement('div');
        overlay.className = 'cv-modal-overlay transfer-player-overlay';

        var panel = document.createElement('div');
        panel.className = 'cv-modal-panel';

        // Header
        var header = document.createElement('div');
        header.className = 'cv-modal-header';

        var titleEl = document.createElement('span');
        titleEl.className = 'cv-modal-title';
        titleEl.textContent = window.t('transfer.sendToPlayer');

        var closeXBtn = document.createElement('button');
        closeXBtn.type = 'button';
        closeXBtn.className = 'cv-modal-close';
        closeXBtn.title = window.t('transfer.close');
        closeXBtn.innerHTML = '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

        header.appendChild(titleEl);
        header.appendChild(closeXBtn);
        panel.appendChild(header);

        // Body
        var body = document.createElement('div');
        body.className = 'cv-modal-body transfer-picker-body';

        if (itemName) {
            var itemLabel = document.createElement('div');
            itemLabel.className = 'transfer-picker-item-name';
            itemLabel.textContent = itemName;
            body.appendChild(itemLabel);
        }

        var selectedClientId = null;
        var sendBtn = null;

        if (!hasPlayers) {
            var noPlayers = document.createElement('div');
            noPlayers.className = 'transfer-no-players';

            var noPlayersMsg = document.createElement('p');
            noPlayersMsg.className = 'transfer-no-players-msg';
            noPlayersMsg.textContent = window.t('transfer.noPlayersOnline');

            var noPlayersHint = document.createElement('p');
            noPlayersHint.className = 'transfer-no-players-hint';
            noPlayersHint.textContent = window.t('transfer.noPlayersHint');

            noPlayers.appendChild(noPlayersMsg);
            noPlayers.appendChild(noPlayersHint);
            body.appendChild(noPlayers);
        } else {
            var sendToLabel = document.createElement('div');
            sendToLabel.className = 'cv-modal-label';
            sendToLabel.textContent = window.t('transfer.sendTo');
            body.appendChild(sendToLabel);

            var playerList = document.createElement('div');
            playerList.className = 'transfer-player-list';

            players.forEach(function (player) {
                var item = document.createElement('div');
                item.className = 'transfer-player-item';
                item.dataset.clientId = player.clientId;

                var nameSpan = document.createElement('span');
                nameSpan.className = 'transfer-player-name';
                nameSpan.textContent = player.playerName;

                item.appendChild(nameSpan);
                item.addEventListener('click', function () {
                    playerList.querySelectorAll('.transfer-player-item').forEach(function (el) {
                        el.classList.remove('selected');
                    });
                    item.classList.add('selected');
                    selectedClientId = player.clientId;
                    if (sendBtn) sendBtn.disabled = false;
                });

                playerList.appendChild(item);
            });

            body.appendChild(playerList);
        }

        panel.appendChild(body);

        // Footer
        var footer = document.createElement('div');
        footer.className = 'cv-modal-footer';

        var cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.className = 'btn-secondary sm';
        cancelBtn.textContent = hasPlayers ? window.t('transfer.cancel') : window.t('transfer.close');

        if (hasPlayers) {
            sendBtn = document.createElement('button');
            sendBtn.type = 'button';
            sendBtn.className = 'btn-primary sm';
            sendBtn.textContent = window.t('transfer.send');
            sendBtn.disabled = true;
            sendBtn.addEventListener('click', function () {
                if (!selectedClientId) return;
                var compact = window.compactForTransfer(itemData, srcType, moduleMeta);
                sendOffer(selectedClientId, compact, srcType, moduleMeta, moduleId, itemId);
                close();
            });
        }

        footer.appendChild(cancelBtn);
        if (sendBtn) footer.appendChild(sendBtn);
        panel.appendChild(footer);

        overlay.appendChild(panel);
        document.body.appendChild(overlay);

        function close() {
            overlay.remove();
            document.removeEventListener('keydown', keyHandler);
        }

        cancelBtn.addEventListener('click', close);
        closeXBtn.addEventListener('click', close);
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) close();
        });

        var keyHandler = function (e) {
            if (e.key === 'Escape') { e.stopPropagation(); close(); }
        };
        document.addEventListener('keydown', keyHandler);
    }

    function sendOffer(targetClientId, compactItem, srcType, moduleMeta, moduleId, itemId) {
        var txnId = generateTxnId();
        var metaAttrs = (moduleMeta && moduleMeta.attrs) ? moduleMeta.attrs.map(function (a) {
            return { name: a.name, type: a.type };
        }) : [];
        sendMessage('offer', targetClientId, {
            txn: txnId,
            mode: 'move',
            src: srcType,
            data: compactItem,
            meta: { attrs: metaAttrs }
        });
        pendingOutgoing[txnId] = {
            targetClient: targetClientId,
            mode: 'move',
            src: srcType,
            moduleId: moduleId,
            itemId: itemId,
            timestamp: Date.now(),
            state: 'pending'
        };
        window.reapplyPendingStates();
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
        if (item.notes) compact.notes = item.notes;

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

    window.openSendToPlayerModal = openSendToPlayerModal;

    window.cancelPendingTransfer = function (txnId) {
        var txn = pendingOutgoing[txnId];
        if (!txn) return;
        sendMessage('cancel', txn.targetClient, { txn: txnId });
        clearPendingOutgoing(txnId);
        window.showToast(window.t('transfer.cancelled'), 'info');
    };

    window.reapplyPendingStates = function () {
        Object.keys(pendingOutgoing).forEach(function (txnId) {
            var txn = pendingOutgoing[txnId];
            if (!txn.moduleId || !txn.itemId) return;
            var row = document.querySelector('[data-module-id="' + txn.moduleId + '"][data-item-id="' + txn.itemId + '"]');
            if (!row) return;
            row.classList.add('list-item-pending');
            if (!row.querySelector('.list-item-cancel-btn')) {
                var btn = document.createElement('button');
                btn.className = 'list-item-cancel-btn';
                btn.textContent = window.t('transfer.cancel');
                btn.addEventListener('click', (function (tid) {
                    return function () { window.cancelPendingTransfer(tid); };
                })(txnId));
                row.appendChild(btn);
            }
        });
    };

    // Pure helpers exposed for vitest (rule 19)
    window.compactForTransfer = compactForTransfer;
    window.expandReceived = expandReceived;
    window.validateIncoming = validateIncoming;
    window.generateTxnId = generateTxnId;
})();
