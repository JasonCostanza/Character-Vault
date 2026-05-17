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
    var isGM = false;

    // ── Transaction Tracking ──
    var pendingOutgoing = {};    // txnId → { targetClient, mode, src, moduleId, itemId, timestamp, state }
    var pendingIncoming = {};    // txnId → { fromClient, fromName, mode, src, data, meta, receivedAt }
    var activeIncomingModal = null; // { txnId, forceClose, onSenderDisconnected }

    // ── Initialization ──
    var _sweepInterval = null;
    var _keySeq = 0;
    var _chunkBuffers = {};    // txnId → { n, parts, timer }

    function initSync() {
        if (_sweepInterval !== null) return;
        if (typeof TS === 'undefined') return;
        Promise.all([
            TS.clients.whoAmI(),
            TS.players.whoAmI()
        ]).then(function (results) {
            myClient = results[0];
            myPlayer = results[1];
            return Promise.all([
                TS.sync.getClientsConnected(),
                myPlayer ? TS.players.getMoreInfo([myPlayer.id]) : Promise.resolve([])
            ]);
        }).then(function (results) {
            var clients = results[0];
            var playerInfo = results[1];
            if (playerInfo && playerInfo[0] && playerInfo[0].rights) {
                isGM = !!playerInfo[0].rights.canGm;
            }
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
            case 'chunk':     handleChunk(msg, fromClientId); break;
            case 'chunk_ack': break;
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
            // Notify open incoming modal if its sender disconnected
            if (activeIncomingModal) {
                var inc = pendingIncoming[activeIncomingModal.txnId];
                if (inc && inc.fromClient === clientId) {
                    activeIncomingModal.onSenderDisconnected();
                }
            }
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
        var txnId = msg.txn;
        var fromName = msg.from || 'Unknown';
        var itemName = (msg.data && msg.data.name) ? msg.data.name : '';
        var toastMsg = window.t('transfer.incomingFrom', { name: fromName }) + (itemName ? ' ' + itemName : '');
        window.showToast(toastMsg, 'info', {
            label: window.t('transfer.view'),
            onClick: function () { openIncomingTransferModal(txnId); }
        });
        console.log('[CV Sync] Offer received txn:', txnId, 'from:', fromName);
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
        if (activeIncomingModal && activeIncomingModal.txnId === msg.txn) {
            activeIncomingModal.forceClose();
        }
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
        if (type === 'offer' && json.length > MAX_MSG_LENGTH) {
            sendChunked(targetClient, json, msg.txn);
            return;
        }
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

    // ── Chunking ──

    function splitIntoChunks(str, size) {
        var chunks = [];
        for (var i = 0; i < str.length; i += size) {
            chunks.push(str.slice(i, i + size));
        }
        return chunks;
    }

    function splitIntoChunksByEncodedLen(str, maxEncodedLen) {
        var chunks = [];
        var i = 0;
        while (i < str.length) {
            var lo = 1, hi = str.length - i;
            while (lo < hi) {
                var mid = Math.ceil((lo + hi) / 2);
                if (JSON.stringify(str.slice(i, i + mid)).length <= maxEncodedLen) {
                    lo = mid;
                } else {
                    hi = mid - 1;
                }
            }
            chunks.push(str.slice(i, i + lo));
            i += lo;
        }
        return chunks;
    }

    function joinChunks(parts, n) {
        var result = '';
        for (var i = 0; i < n; i++) result += (parts[i] || '');
        return result;
    }

    function sendChunked(targetClient, json, txnId) {
        if (!txnId) return;
        // Probe worst-case envelope (i/n as 99) to compute how many chars the d-value can occupy
        // when JSON-serialized (including surrounding quotes). 502 - probe.length accounts for
        // the 2 chars of "" already in the probe.
        var probe = JSON.stringify({ v: PROTOCOL_VERSION, t: 'chunk', txn: txnId, i: 99, n: 99, d: '' });
        var dBudget = 502 - probe.length;
        var chunks = splitIntoChunksByEncodedLen(json, dBudget);
        console.log('[CV Sync] Chunking offer ' + txnId + ' into ' + chunks.length + ' parts');
        chunks.forEach(function (slice, idx) {
            TS.sync.send(JSON.stringify({
                v: PROTOCOL_VERSION, t: 'chunk',
                txn: txnId, i: idx, n: chunks.length, d: slice
            }), targetClient).catch(console.error);
        });
    }

    function handleChunk(msg, fromClientId) {
        if (!msg.txn || msg.i === undefined || msg.n === undefined || !msg.d) return;
        var txnId = msg.txn;
        if (!_chunkBuffers[txnId]) {
            _chunkBuffers[txnId] = {
                n: msg.n,
                parts: {},
                received: 0,
                timer: setTimeout(function () { delete _chunkBuffers[txnId]; }, 15000)
            };
        }
        var buf = _chunkBuffers[txnId];
        if (buf.parts[msg.i] === undefined) buf.received++;
        buf.parts[msg.i] = msg.d;
        if (buf.received === buf.n) {
            clearTimeout(buf.timer);
            delete _chunkBuffers[txnId];
            var fullJson = joinChunks(buf.parts, buf.n);
            var assembled;
            try { assembled = JSON.parse(fullJson); } catch (e) {
                console.warn('[CV Sync] Failed to parse reassembled chunks for txn:', txnId);
                return;
            }
            handleOffer(assembled, fromClientId);
        }
    }

    // ── Pending State ──

    function clearPendingOutgoing(txnId) {
        var txn = pendingOutgoing[txnId];
        delete pendingOutgoing[txnId];
        if (txn) removePendingUIState(txn);
    }

    function removePendingUIState(txn) {
        if (!txn.moduleId || !txn.itemId) return;
        var stillPending = Object.values(pendingOutgoing).some(function (other) {
            return other.moduleId === txn.moduleId && other.itemId === txn.itemId;
        });
        if (stillPending) return;
        var row = document.querySelector('[data-module-id="' + txn.moduleId + '"][data-item-id="' + txn.itemId + '"]');
        if (!row) return;
        row.classList.remove('list-item-pending');
        var cancelBtn = row.querySelector('.list-item-cancel-btn');
        if (cancelBtn) cancelBtn.remove();
    }

    function removeTransferredItem(txn) {
        var mod = (window.modules || []).find(function (m) { return m.id === txn.moduleId; });
        if (!mod || !mod.content) return;
        var moduleType = (txn.src === 'weapons' || txn.src === 'spells') ? txn.src : 'list';

        if (txn.src === 'weapons') {
            if (!Array.isArray(mod.content.weapons)) return;
            if (!spliceById(mod.content.weapons, txn.itemId)) return;
        } else if (txn.src === 'spells') {
            var found = (mod.content.categories || []).some(function (cat) {
                return spliceById(cat.spells || [], txn.itemId);
            });
            if (!found) return;
        } else {
            if (!Array.isArray(mod.content.items)) return;
            if (!spliceById(mod.content.items, txn.itemId)) return;
        }

        window.scheduleSave();
        var moduleEl = document.querySelector('[data-id="' + txn.moduleId + '"]');
        if (moduleEl) {
            var bodyEl = moduleEl.querySelector('.module-body');
            var typeDef = window.MODULE_TYPES && window.MODULE_TYPES[moduleType];
            if (bodyEl && typeDef && typeDef.renderBody) {
                typeDef.renderBody(bodyEl, mod, window.isPlayMode !== false);
            }
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
        var transferMode = isGM ? 'copy' : 'move';

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

        var sendBtn = null;
        var selectedClientId = null;         // non-GM single-select
        var selectedClientIds = new Set();   // GM multi-select

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

                if (isGM) {
                    item.addEventListener('click', function () {
                        if (selectedClientIds.has(player.clientId)) {
                            selectedClientIds.delete(player.clientId);
                            item.classList.remove('selected');
                        } else {
                            selectedClientIds.add(player.clientId);
                            item.classList.add('selected');
                        }
                        if (sendBtn) sendBtn.disabled = selectedClientIds.size === 0;
                    });
                } else {
                    item.addEventListener('click', function () {
                        playerList.querySelectorAll('.transfer-player-item').forEach(function (el) {
                            el.classList.remove('selected');
                        });
                        item.classList.add('selected');
                        selectedClientId = player.clientId;
                        if (sendBtn) sendBtn.disabled = false;
                    });
                }

                playerList.appendChild(item);
            });

            body.appendChild(playerList);

            // Mode toggle
            var modeLabel = document.createElement('div');
            modeLabel.className = 'cv-modal-label';
            modeLabel.textContent = window.t('transfer.modeLabel');
            body.appendChild(modeLabel);

            var modeRow = document.createElement('div');
            modeRow.className = 'transfer-mode-row';

            var modeDescEl = document.createElement('span');
            modeDescEl.className = 'cv-toggle-label';
            modeDescEl.textContent = transferMode === 'copy'
                ? window.t('transfer.modeCopy')
                : window.t('transfer.modeGive');

            var modeToggle = window.makeCvToggle(transferMode === 'copy', function (isCopy) {
                transferMode = isCopy ? 'copy' : 'move';
                modeDescEl.textContent = isCopy
                    ? window.t('transfer.modeCopy')
                    : window.t('transfer.modeGive');
            });

            modeRow.appendChild(modeToggle);
            modeRow.appendChild(modeDescEl);
            body.appendChild(modeRow);
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
                var compact = window.compactForTransfer(itemData, srcType, moduleMeta);
                if (isGM) {
                    selectedClientIds.forEach(function (clientId) {
                        sendOffer(clientId, compact, srcType, moduleMeta, moduleId, itemId, transferMode);
                    });
                } else {
                    if (!selectedClientId) return;
                    sendOffer(selectedClientId, compact, srcType, moduleMeta, moduleId, itemId, transferMode);
                }
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

    function sendOffer(targetClientId, compactItem, srcType, moduleMeta, moduleId, itemId, mode) {
        var txnId = generateTxnId();
        var transferMode = mode || 'move';
        var meta;
        if (srcType === 'weapons') {
            meta = buildWeaponTransferMeta(compactItem, moduleMeta);
        } else {
            var metaAttrs = (moduleMeta && moduleMeta.attrs) ? moduleMeta.attrs.map(function (a) {
                return { name: a.name, type: a.type };
            }) : [];
            if (srcType === 'spells') {
                meta = {
                    attrs: metaAttrs,
                    categoryName: (moduleMeta && moduleMeta.categoryName) || null,
                    slotLevel: (moduleMeta && moduleMeta.slotLevel !== undefined) ? moduleMeta.slotLevel : null
                };
            } else {
                meta = { attrs: metaAttrs };
            }
        }
        sendMessage('offer', targetClientId, {
            txn: txnId,
            mode: transferMode,
            src: srcType,
            data: compactItem,
            meta: meta
        });
        pendingOutgoing[txnId] = {
            targetClient: targetClientId,
            mode: transferMode,
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
                if (activeIncomingModal && activeIncomingModal.txnId === txnId) {
                    activeIncomingModal.forceClose();
                }
                window.showToast(window.t('transfer.timedOut'), 'info');
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
        if (sourceType === 'weapons') return compactWeapon(item);
        if (sourceType === 'spells') return compactSpell(item, moduleData);
        return Object.assign({}, item);
    }

    function compactSpell(spell, moduleData) {
        var compact = {};
        if (spell.name) compact.name = spell.name;
        if (spell.description) compact.description = spell.description;

        var attrs = (moduleData && moduleData.attrs) ? moduleData.attrs : [];
        var idToName = {};
        attrs.forEach(function (attr) { idToName[attr.id] = attr.name; });

        var compactValues = compactAttrValues(spell.values, idToName);
        if (Object.keys(compactValues).length > 0) compact.values = compactValues;
        return compact;
    }

    function compactWeapon(weapon) {
        var compact = {};
        compact.name = weapon.name || '';
        compact.slot = weapon.slot || 'main';
        compact.kind = weapon.kind || 'melee';
        if (weapon.icon) compact.icon = weapon.icon;
        if (weapon.abilityMod) compact.abilityMod = weapon.abilityMod;
        if (weapon.proficient) compact.proficient = true;
        if (weapon.attackBonusOverride !== null && weapon.attackBonusOverride !== undefined) compact.attackBonusOverride = weapon.attackBonusOverride;
        if (weapon.twoHanded) compact.twoHanded = true;
        if (weapon.range) compact.range = weapon.range;
        if (weapon.ammoCount !== null && weapon.ammoCount !== undefined) compact.ammoCount = weapon.ammoCount;
        if (weapon.notesMarkdown) compact.notesMarkdown = weapon.notesMarkdown;
        if (weapon.acBonus !== null && weapon.acBonus !== undefined) compact.acBonus = weapon.acBonus;
        if (weapon.shieldHp !== null && weapon.shieldHp !== undefined) compact.shieldHp = weapon.shieldHp;
        if (weapon.shieldHpMax !== null && weapon.shieldHpMax !== undefined) compact.shieldHpMax = weapon.shieldHpMax;
        if (Array.isArray(weapon.damageInstances) && weapon.damageInstances.length) {
            compact.damageInstances = weapon.damageInstances.map(function (inst) {
                var ci = {};
                if (inst.dice) ci.dice = inst.dice;
                if (inst.modFromAbility) ci.modFromAbility = true;
                if (inst.flatBonus) ci.flatBonus = inst.flatBonus;
                if (inst.damageType) ci.damageType = inst.damageType;
                return ci;
            });
        }
        if (Array.isArray(weapon.traits) && weapon.traits.length) {
            compact.traits = weapon.traits.map(function (tr) {
                var ct = { key: tr.key };
                if (tr.value !== null && tr.value !== undefined) ct.value = tr.value;
                return ct;
            });
        }
        if (Array.isArray(weapon.attachedEnhancements) && weapon.attachedEnhancements.length) {
            compact.attachedEnhancements = weapon.attachedEnhancements.slice();
        }
        if (Array.isArray(weapon.firingModes) && weapon.firingModes.length) {
            compact.firingModes = weapon.firingModes.map(function (fm) {
                var cfm = { name: fm.name, ammoCost: fm.ammoCost };
                if (fm.diceModifier !== null && fm.diceModifier !== undefined) cfm.diceModifier = fm.diceModifier;
                if (fm.damageBonus !== null && fm.damageBonus !== undefined) cfm.damageBonus = fm.damageBonus;
                return cfm;
            });
        }
        var optionals = ['proficiencyRank', 'skillName', 'skillValue', 'poolAttribute', 'poolSkill', 'poolSize',
                         'weaponCategory', 'cpredStat', 'cpredSkillValue', 'governingTrait', 'baseDamageFlat',
                         'damageCategory', 'impaling', 'armorSavePenalty', 'poolAdjustment', 'accuracy'];
        optionals.forEach(function (f) {
            var v = weapon[f];
            if (v !== null && v !== undefined && v !== false && v !== 0 && v !== '') compact[f] = v;
        });
        if (weapon.poolAutoCompute) compact.poolAutoCompute = true;
        return compact;
    }

    function compactListItem(item, moduleData) {
        var compact = {};
        if (item.name) compact.name = item.name;
        if (item.notes) compact.notes = item.notes;

        var attrs = (moduleData && moduleData.attrs) ? moduleData.attrs : [];
        var idToName = {};
        attrs.forEach(function (attr) { idToName[attr.id] = attr.name; });

        var compactValues = compactAttrValues(item.values, idToName);
        if (Object.keys(compactValues).length > 0) compact.values = compactValues;
        return compact;
    }

    function expandReceived(compact, sourceType) {
        if (sourceType === 'list') return expandListItem(compact);
        if (sourceType === 'weapons') return expandWeapon(compact);
        if (sourceType === 'spells') return expandSpell(compact);
        return Object.assign({}, compact);
    }

    function expandSpell(compact) {
        return {
            id: 'sp_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 5),
            name: compact.name || '',
            description: compact.description || '',
            order: 0,
            expanded: false,
            values: compact.values ? Object.assign({}, compact.values) : {}
        };
    }

    function expandListItem(compact) {
        return {
            id: generateLocalId(),
            name: compact.name || '',
            notes: compact.notes || '',
            values: compact.values ? Object.assign({}, compact.values) : {}
        };
    }

    function generateLocalId() {
        return 'item_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
    }

    function expandWeapon(compact) {
        var defaults = {
            name: '', slot: 'main', kind: 'melee', icon: null, abilityMod: null,
            proficient: false, attackBonusOverride: null, damageInstances: [], range: null,
            ammoCount: null, traits: [], notesMarkdown: '', twoHanded: false,
            acBonus: null, shieldHp: null, shieldHpMax: null, proficiencyRank: null,
            skillName: null, skillValue: null, poolAttribute: null, poolSkill: null,
            poolSize: null, weaponCategory: null, cpredStat: null, cpredSkillValue: null,
            governingTrait: null, baseDamageFlat: null, damageCategory: null,
            firingModes: null, impaling: null, armorSavePenalty: null,
            attachedEnhancements: null, poolAdjustment: null, poolAutoCompute: false,
            accuracy: null, linkedStatModuleId: null
        };
        return Object.assign({}, defaults, compact, { id: generateWeaponLocalId() });
    }

    function generateWeaponLocalId() {
        return 'wpn_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
    }

    function buildWeaponTransferMeta(compact, moduleContent) {
        var customTraits = [];
        if (Array.isArray(compact.traits) && moduleContent && Array.isArray(moduleContent.customWeaponTraits)) {
            compact.traits.forEach(function (tr) {
                if (tr.key && tr.key.indexOf('custom.') === 0) {
                    var found = moduleContent.customWeaponTraits.find(function (ct) { return ct.key === tr.key; });
                    if (found) customTraits.push(found);
                }
            });
        }
        var enhancements = [];
        if (Array.isArray(compact.attachedEnhancements) && moduleContent && Array.isArray(moduleContent.enhancementCatalog)) {
            compact.attachedEnhancements.forEach(function (key) {
                var found = moduleContent.enhancementCatalog.find(function (e) { return e.key === key; });
                if (found) enhancements.push(found);
            });
        }
        return { customTraits: customTraits, enhancements: enhancements };
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

    // ── Item Insertion ──

    function defaultValueForType(type) {
        if (type === 'toggle') return false;
        if (type === 'number') return 0;
        if (type === 'number-pair') return { current: 0, max: 0 };
        if (type === 'quantity') return 1;
        return '';
    }

    function compactAttrValues(values, idToName) {
        if (!values || typeof values !== 'object') return {};
        var compactValues = {};
        Object.keys(values).forEach(function (attrId) {
            var val = values[attrId];
            if (val === null || val === undefined || val === '' || val === false || val === 0) return;
            compactValues[idToName[attrId] || attrId] = val;
        });
        return compactValues;
    }

    function remapByName(attributes, namedValues) {
        var nameToId = {};
        attributes.forEach(function (a) { nameToId[a.name.toLowerCase()] = a.id; });
        var remapped = {};
        Object.keys(namedValues || {}).forEach(function (attrName) {
            var attrId = nameToId[attrName.toLowerCase()];
            if (attrId) remapped[attrId] = namedValues[attrName];
        });
        return remapped;
    }

    function spliceById(arr, id) {
        var idx = arr.findIndex(function (it) { return it.id === id; });
        if (idx === -1) return false;
        arr.splice(idx, 1);
        return true;
    }

    function buildAttrPreviewEl(valuesObj, formatFn) {
        var keys = Object.keys(valuesObj || {});
        if (!keys.length) return null;
        var div = document.createElement('div');
        div.className = 'transfer-attr-preview';
        keys.forEach(function (name) {
            var row = document.createElement('div');
            row.className = 'transfer-attr-row';
            var nameEl = document.createElement('span');
            nameEl.className = 'transfer-attr-name';
            nameEl.textContent = name;
            var valEl = document.createElement('span');
            valEl.className = 'transfer-attr-val';
            valEl.textContent = formatFn ? formatFn(valuesObj[name]) : String(valuesObj[name]);
            row.appendChild(nameEl);
            row.appendChild(valEl);
            div.appendChild(row);
        });
        return div;
    }

    function insertListItem(targetModuleId, expandedItem, metaAttrs) {
        var mod = (window.modules || []).find(function (m) { return m.id === targetModuleId; });
        if (!mod || !mod.content) return;
        if (!Array.isArray(mod.content.attributes)) mod.content.attributes = [];
        if (!Array.isArray(mod.content.items)) mod.content.items = [];

        (metaAttrs || []).forEach(function (meta) {
            var exists = mod.content.attributes.some(function (a) {
                return a.name.toLowerCase() === meta.name.toLowerCase();
            });
            if (!exists) {
                var newAttr = {
                    id: 'attr_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
                    name: meta.name,
                    type: meta.type,
                    icon: null,
                    defaultValue: defaultValueForType(meta.type),
                    pinned: false,
                    builtIn: false
                };
                mod.content.attributes.push(newAttr);
                mod.content.items.forEach(function (item) {
                    if (!item.values) item.values = {};
                    item.values[newAttr.id] = newAttr.defaultValue;
                });
            }
        });

        var remappedValues = remapByName(mod.content.attributes, expandedItem.values);

        var maxOrder = mod.content.items.reduce(function (max, it) {
            return (it.order != null && it.order > max) ? it.order : max;
        }, -1);

        mod.content.items.push({
            id: expandedItem.id,
            name: expandedItem.name,
            notes: expandedItem.notes || '',
            order: maxOrder + 1,
            values: remappedValues
        });

        var moduleEl = document.querySelector('[data-id="' + targetModuleId + '"]');
        if (moduleEl) {
            var bodyEl = moduleEl.querySelector('.module-body');
            var typeDef = window.MODULE_TYPES && window.MODULE_TYPES['list'];
            if (bodyEl && typeDef && typeDef.renderBody) {
                typeDef.renderBody(bodyEl, mod, true);
            }
        }

        window.scheduleSave();
    }

    function mergeByName(catalog, incomingArr, buildEntry) {
        var remap = {};
        (incomingArr || []).forEach(function (incoming) {
            var existing = catalog.find(function (e) {
                return e.name.toLowerCase() === incoming.name.toLowerCase();
            });
            if (existing) {
                remap[incoming.key] = existing.key;
            } else {
                var entry = buildEntry(incoming);
                catalog.push(entry);
                remap[incoming.key] = entry.key;
            }
        });
        return remap;
    }

    function insertWeapon(targetModuleId, expandedWeapon, meta) {
        var mod = (window.modules || []).find(function (m) { return m.id === targetModuleId; });
        if (!mod || !mod.content) return;
        if (!Array.isArray(mod.content.customWeaponTraits)) mod.content.customWeaponTraits = [];
        if (!Array.isArray(mod.content.enhancementCatalog)) mod.content.enhancementCatalog = [];
        if (!Array.isArray(mod.content.weapons)) mod.content.weapons = [];

        var traitKeyRemap = mergeByName(mod.content.customWeaponTraits, meta.customTraits, function (inc) {
            return { key: 'custom.wt_' + Date.now().toString(36) + '_' + (++_keySeq), name: inc.name, description: inc.description || '' };
        });
        if (Array.isArray(expandedWeapon.traits)) {
            expandedWeapon.traits = expandedWeapon.traits.map(function (tr) {
                return { key: traitKeyRemap[tr.key] || tr.key, value: tr.value !== undefined ? tr.value : null };
            });
        }

        var enhKeyRemap = mergeByName(mod.content.enhancementCatalog, meta.enhancements, function (inc) {
            return Object.assign({}, inc, { key: 'enh_' + Date.now().toString(36) + '_' + (++_keySeq) });
        });
        if (Array.isArray(expandedWeapon.attachedEnhancements)) {
            expandedWeapon.attachedEnhancements = expandedWeapon.attachedEnhancements.map(function (k) {
                return enhKeyRemap[k] || k;
            });
        }

        mod.content.weapons.push(expandedWeapon);

        var moduleEl = document.querySelector('[data-id="' + targetModuleId + '"]');
        if (moduleEl) {
            var bodyEl = moduleEl.querySelector('.module-body');
            var typeDef = window.MODULE_TYPES && window.MODULE_TYPES['weapons'];
            if (bodyEl && typeDef && typeDef.renderBody) {
                typeDef.renderBody(bodyEl, mod, window.isPlayMode !== false);
            }
        }

        window.scheduleSave();
    }

    function insertSpell(targetModuleId, expandedSpell, meta) {
        var mod = (window.modules || []).find(function (m) { return m.id === targetModuleId; });
        if (!mod || !mod.content) return;
        if (typeof window.ensureSpellContent === 'function') window.ensureSpellContent(mod);
        if (!Array.isArray(mod.content.attributes)) mod.content.attributes = [];
        if (!Array.isArray(mod.content.categories)) mod.content.categories = [];

        (meta.attrs || []).forEach(function (incoming) {
            var exists = mod.content.attributes.some(function (a) {
                return a.name.toLowerCase() === incoming.name.toLowerCase();
            });
            if (!exists) {
                var newAttr = {
                    id: 'attr_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
                    name: incoming.name,
                    type: incoming.type,
                    defaultValue: defaultValueForType(incoming.type),
                    pinned: false,
                    builtIn: false
                };
                mod.content.attributes.push(newAttr);
                mod.content.categories.forEach(function (cat) {
                    (cat.spells || []).forEach(function (sp) {
                        if (!sp.values) sp.values = {};
                        sp.values[newAttr.id] = newAttr.defaultValue;
                    });
                });
            }
        });

        expandedSpell.values = remapByName(mod.content.attributes, expandedSpell.values);

        var targetCat = null;
        if (meta.categoryName) {
            targetCat = mod.content.categories.find(function (c) {
                return c.name.toLowerCase() === meta.categoryName.toLowerCase();
            });
        }
        if (!targetCat && meta.slotLevel !== null && meta.slotLevel !== undefined) {
            targetCat = mod.content.categories.find(function (c) { return c.slotLevel === meta.slotLevel; });
        }
        if (!targetCat) {
            targetCat = {
                id: 'cat_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
                name: meta.categoryName || '',
                slotLevel: (meta.slotLevel !== undefined) ? meta.slotLevel : null,
                collapsed: false,
                spells: []
            };
            mod.content.categories.push(targetCat);
        }
        if (!Array.isArray(targetCat.spells)) targetCat.spells = [];

        expandedSpell.order = targetCat.spells.length;
        targetCat.spells.push(expandedSpell);

        var moduleEl = document.querySelector('[data-id="' + targetModuleId + '"]');
        if (moduleEl) {
            var bodyEl = moduleEl.querySelector('.module-body');
            var typeDef = window.MODULE_TYPES && window.MODULE_TYPES['spells'];
            if (bodyEl && typeDef && typeDef.renderBody) {
                typeDef.renderBody(bodyEl, mod, window.isPlayMode !== false);
            }
        }

        window.scheduleSave();
    }

    // ── Incoming Transfer Modal ──

    function openIncomingTransferModal(txnId) {
        var incoming = pendingIncoming[txnId];
        if (!incoming) return;

        var existing = document.querySelector('.transfer-incoming-overlay');
        if (existing) existing.remove();

        var isWeaponTransfer = (incoming.src === 'weapons');
        var isSpellTransfer = (incoming.src === 'spells');
        var targetModuleType = isWeaponTransfer ? 'weapons' : isSpellTransfer ? 'spells' : 'list';
        var targetModules = (window.modules || []).filter(function (m) { return m.type === targetModuleType; });
        var selectedModuleId = targetModules.length > 0 ? targetModules[0].id : null;
        var hasTargetModules = targetModules.length > 0;

        var itemName = (incoming.data && incoming.data.name) ? incoming.data.name : '';
        var fromName = incoming.fromName || 'Unknown';
        var isMove = incoming.mode !== 'copy';
        var senderDisconnected = !connectedPlayers[incoming.fromClient];
        var disconnectTimer = null;
        var closeSelectHandler = null;

        var overlay = document.createElement('div');
        overlay.className = 'cv-modal-overlay transfer-incoming-overlay';

        var panel = document.createElement('div');
        panel.className = 'cv-modal-panel';

        // Header
        var header = document.createElement('div');
        header.className = 'cv-modal-header';
        var titleEl = document.createElement('span');
        titleEl.className = 'cv-modal-title';
        titleEl.textContent = window.t('transfer.incomingTransfer');
        var closeXBtn = document.createElement('button');
        closeXBtn.type = 'button';
        closeXBtn.className = 'cv-modal-close';
        closeXBtn.title = window.t('transfer.close');
        closeXBtn.innerHTML = '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
        header.appendChild(titleEl);
        header.appendChild(closeXBtn);
        panel.appendChild(header);

        var body = document.createElement('div');
        body.className = 'cv-modal-body';

        var fromLabel = document.createElement('div');
        fromLabel.className = 'cv-modal-label';
        fromLabel.textContent = window.t('transfer.from');
        var fromValue = document.createElement('div');
        fromValue.className = 'transfer-meta-value';
        fromValue.textContent = fromName;
        body.appendChild(fromLabel);
        body.appendChild(fromValue);

        var itemLabel = document.createElement('div');
        itemLabel.className = 'cv-modal-label';
        itemLabel.textContent = window.t('transfer.item');
        var itemValue = document.createElement('div');
        itemValue.className = 'transfer-meta-value transfer-item-name';
        itemValue.textContent = itemName;
        body.appendChild(itemLabel);
        body.appendChild(itemValue);

        var modeLabel = document.createElement('div');
        modeLabel.className = 'cv-modal-label';
        modeLabel.textContent = window.t('transfer.mode');
        var modeValue = document.createElement('div');
        modeValue.className = 'transfer-meta-value';
        modeValue.textContent = isMove ? window.t('transfer.giveDescription') : window.t('transfer.copyDescription');
        body.appendChild(modeLabel);
        body.appendChild(modeValue);

        if (isWeaponTransfer) {
            var weaponData = incoming.data || {};
            if (Array.isArray(weaponData.damageInstances) && weaponData.damageInstances.length) {
                var dmgDiv = document.createElement('div');
                dmgDiv.className = 'transfer-attr-preview';
                weaponData.damageInstances.forEach(function (inst) {
                    var row = document.createElement('div');
                    row.className = 'transfer-attr-row';
                    var nameEl = document.createElement('span');
                    nameEl.className = 'transfer-attr-name';
                    nameEl.textContent = inst.damageType || '—';
                    var valEl = document.createElement('span');
                    valEl.className = 'transfer-attr-val';
                    valEl.textContent = inst.dice || '';
                    row.appendChild(nameEl);
                    row.appendChild(valEl);
                    dmgDiv.appendChild(row);
                });
                body.appendChild(dmgDiv);
            }
            if (Array.isArray(weaponData.traits) && weaponData.traits.length) {
                var traitsEl = document.createElement('div');
                traitsEl.className = 'transfer-meta-value transfer-weapon-traits';
                traitsEl.textContent = weaponData.traits.map(function (tr) {
                    var key = tr.key || '';
                    return key.split('.').pop();
                }).join(', ');
                body.appendChild(traitsEl);
            }
        } else if (isSpellTransfer) {
            var spellData = incoming.data || {};
            if (spellData.description) {
                var descPreview = document.createElement('div');
                descPreview.className = 'transfer-attr-preview';
                var descText = document.createElement('div');
                descText.className = 'transfer-spell-description';
                var excerpt = spellData.description;
                if (excerpt.length > 120) excerpt = excerpt.slice(0, 120) + '...';
                descText.textContent = excerpt;
                descPreview.appendChild(descText);
                body.appendChild(descPreview);
            }
            var spellAttrEl = buildAttrPreviewEl(spellData.values, String);
            if (spellAttrEl) body.appendChild(spellAttrEl);
        } else {
            // Values are name-keyed (compact format), not attr-ID-keyed
            var listAttrEl = buildAttrPreviewEl(incoming.data && incoming.data.values, function (val) {
                return (val && typeof val === 'object') ? (val.current + '/' + val.max) : String(val);
            });
            if (listAttrEl) body.appendChild(listAttrEl);
        }

        var targetLabel = document.createElement('div');
        targetLabel.className = 'cv-modal-label';
        targetLabel.textContent = window.t('transfer.addTo');
        body.appendChild(targetLabel);

        var typeDefaultLabel = window.t('type.' + targetModuleType);
        var noModulesKey = { weapons: 'transfer.noWeaponModules', spells: 'transfer.noSpellModules', list: 'transfer.noListModules' }[targetModuleType];
        if (!hasTargetModules) {
            var noListMsg = document.createElement('div');
            noListMsg.className = 'transfer-no-list-msg';
            noListMsg.textContent = window.t(noModulesKey);
            body.appendChild(noListMsg);
        } else if (targetModules.length === 1) {
            var singleModEl = document.createElement('div');
            singleModEl.className = 'transfer-meta-value';
            singleModEl.textContent = targetModules[0].title || typeDefaultLabel;
            body.appendChild(singleModEl);
        } else {
            var selectWrapper = document.createElement('div');
            selectWrapper.className = 'cv-select';
            var trigger = document.createElement('button');
            trigger.type = 'button';
            trigger.className = 'cv-select-trigger';
            trigger.innerHTML = '<span class="cv-select-value">' + window.escapeHtml(targetModules[0].title || typeDefaultLabel) + '</span>' +
                '<svg class="icon" xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>';
            var menu = document.createElement('ul');
            menu.className = 'cv-select-menu';
            targetModules.forEach(function (mod, idx) {
                var li = document.createElement('li');
                li.className = 'cv-select-option' + (idx === 0 ? ' selected' : '');
                li.textContent = mod.title || typeDefaultLabel;
                li.addEventListener('click', function () {
                    selectedModuleId = mod.id;
                    trigger.querySelector('.cv-select-value').textContent = mod.title || typeDefaultLabel;
                    menu.querySelectorAll('.cv-select-option').forEach(function (o) {
                        o.classList.toggle('selected', o === li);
                    });
                    selectWrapper.classList.remove('open');
                });
                menu.appendChild(li);
            });
            trigger.addEventListener('click', function (e) {
                e.stopPropagation();
                var rect = trigger.getBoundingClientRect();
                menu.style.position = 'fixed';
                menu.style.top = (rect.bottom + 2) + 'px';
                menu.style.left = rect.left + 'px';
                menu.style.minWidth = rect.width + 'px';
                selectWrapper.classList.toggle('open');
            });
            closeSelectHandler = function () { selectWrapper.classList.remove('open'); };
            document.addEventListener('click', closeSelectHandler);
            selectWrapper.appendChild(trigger);
            selectWrapper.appendChild(menu);
            body.appendChild(selectWrapper);
        }

        var disconnectMsg = document.createElement('div');
        disconnectMsg.className = 'transfer-disconnect-msg';
        disconnectMsg.textContent = window.t('transfer.senderDisconnected');
        disconnectMsg.style.display = senderDisconnected ? '' : 'none';
        body.appendChild(disconnectMsg);

        panel.appendChild(body);

        var footer = document.createElement('div');
        footer.className = 'cv-modal-footer';

        var declineBtn = document.createElement('button');
        declineBtn.type = 'button';
        declineBtn.className = 'btn-secondary sm';
        declineBtn.textContent = window.t('transfer.decline');

        var acceptBtn = document.createElement('button');
        acceptBtn.type = 'button';
        acceptBtn.className = 'btn-primary sm';
        acceptBtn.textContent = window.t('transfer.accept');
        acceptBtn.disabled = !hasTargetModules || senderDisconnected;

        footer.appendChild(declineBtn);
        footer.appendChild(acceptBtn);
        panel.appendChild(footer);
        overlay.appendChild(panel);
        document.body.appendChild(overlay);

        function forceClose() {
            clearTimeout(disconnectTimer);
            if (closeSelectHandler) document.removeEventListener('click', closeSelectHandler);
            overlay.remove();
            document.removeEventListener('keydown', keyHandler);
            if (activeIncomingModal && activeIncomingModal.txnId === txnId) {
                activeIncomingModal = null;
            }
        }

        function decline() {
            sendMessage('decline', incoming.fromClient, { txn: txnId });
            delete pendingIncoming[txnId];
            forceClose();
        }

        function accept() {
            if (!selectedModuleId) return;
            var expanded = expandReceived(incoming.data, incoming.src || 'list');
            if (isWeaponTransfer) {
                insertWeapon(selectedModuleId, expanded, incoming.meta || {});
            } else if (isSpellTransfer) {
                insertSpell(selectedModuleId, expanded, incoming.meta || {});
            } else {
                insertListItem(selectedModuleId, expanded, (incoming.meta && incoming.meta.attrs) || []);
            }
            sendMessage('accept', incoming.fromClient, { txn: txnId });
            delete pendingIncoming[txnId];
            window.showToast(window.t('transfer.itemReceived', { item: itemName, name: fromName }), 'info');
            forceClose();
        }

        function onSenderDisconnected() {
            senderDisconnected = true;
            disconnectMsg.style.display = '';
            acceptBtn.disabled = true;
            disconnectTimer = setTimeout(function () {
                if (document.body.contains(overlay)) decline();
            }, 5000);
        }

        activeIncomingModal = { txnId: txnId, forceClose: forceClose, onSenderDisconnected: onSenderDisconnected };

        declineBtn.addEventListener('click', decline);
        acceptBtn.addEventListener('click', accept);
        closeXBtn.addEventListener('click', decline);
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) decline();
        });

        var keyHandler = function (e) {
            if (e.key === 'Escape') { e.stopPropagation(); decline(); }
        };
        document.addEventListener('keydown', keyHandler);
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
        var processedRows = new Set();
        Object.keys(pendingOutgoing).forEach(function (txnId) {
            var txn = pendingOutgoing[txnId];
            if (!txn.moduleId || !txn.itemId) return;
            var row = document.querySelector('[data-module-id="' + txn.moduleId + '"][data-item-id="' + txn.itemId + '"]');
            if (!row) return;
            row.classList.add('list-item-pending');
            var rowKey = txn.moduleId + ':' + txn.itemId;
            if (!processedRows.has(rowKey) && !row.querySelector('.list-item-cancel-btn')) {
                processedRows.add(rowKey);
                var btn = document.createElement('button');
                btn.className = 'list-item-cancel-btn';
                btn.textContent = window.t('transfer.cancel');
                var mid = txn.moduleId;
                var iid = txn.itemId;
                btn.addEventListener('click', function () {
                    var toCancel = Object.keys(pendingOutgoing).filter(function (tid) {
                        var t = pendingOutgoing[tid];
                        return t && t.moduleId === mid && t.itemId === iid;
                    });
                    toCancel.forEach(function (tid) {
                        var t = pendingOutgoing[tid];
                        if (t) sendMessage('cancel', t.targetClient, { txn: tid });
                        clearPendingOutgoing(tid);
                    });
                    window.showToast(window.t('transfer.cancelled'), 'info');
                });
                row.appendChild(btn);
            }
        });
    };

    // Pure helpers exposed for vitest (rule 19)
    window.compactForTransfer = compactForTransfer;
    window.expandReceived = expandReceived;
    window.validateIncoming = validateIncoming;
    window.generateTxnId = generateTxnId;
    window.insertListItem = insertListItem;
    window.insertWeapon = insertWeapon;
    window.insertSpell = insertSpell;
    window.splitIntoChunks = splitIntoChunks;
    window.splitIntoChunksByEncodedLen = splitIntoChunksByEncodedLen;
    window.joinChunks = joinChunks;
    window.handleChunk = handleChunk;
    window.openIncomingTransferModal = openIncomingTransferModal;
})();
