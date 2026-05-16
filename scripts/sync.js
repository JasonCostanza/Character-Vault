(function () {
    // ── Manifest Handlers ──
    window.handleSyncMessage = function (event) {
        console.log('[CV] Sync message received:', event);
        var msg = JSON.parse(event.payload.str);
        var fromClientId = event.payload.fromClient.id;
        if (msg.t === 'ping') {
            TS.sync.send(JSON.stringify({ t: 'pong' }), fromClientId).catch(console.error);
            console.log('[CV] Sent pong to', fromClientId);
        } else if (msg.t === 'pong') {
            console.log('[CV] Pong received from', fromClientId);
        }
    };

    window.handleClientEvent = function (event) {
        console.log('[CV] Client event:', event);
        if (event.kind === 'clientJoinedBoard') {
            var clientId = event.payload.client.id;
            TS.clients.isMe(clientId).then(function (isMe) {
                if (!isMe) {
                    TS.sync.send(JSON.stringify({ t: 'ping' }), clientId).then(function () {
                        console.log('[CV] Ping sent to newly joined client', clientId);
                    }).catch(console.error);
                }
            }).catch(console.error);
        }
    };

    // ── Init ──
    window.initSync = function () {
        if (typeof TS === 'undefined') return;
        console.log('[CV] initSync starting');

        TS.clients.whoAmI().then(function (me) {
            console.log('[CV] whoAmI success:', me);
        }).catch(function (err) {
            console.error('[CV] whoAmI FAILED:', err && err.message ? err.message : err);
        });

        TS.clients.getClientsInThisBoard().then(function (clients) {
            console.log('[CV] getClientsInThisBoard success:', clients);
            if (clients.cause) {
                console.error('[CV] getClientsInThisBoard error cause:', clients.cause);
                return;
            }
            clients.forEach(function (c) {
                TS.clients.isMe(c.id).then(function (isMe) {
                    if (!isMe) {
                        TS.sync.send(JSON.stringify({ t: 'ping' }), c.id).then(function () {
                            console.log('[CV] Ping sent to', c.id, c.player && c.player.name);
                        }).catch(function (err) {
                            console.error('[CV] send ping FAILED:', err && err.message ? err.message : err, 'target:', c.id);
                        });
                    }
                }).catch(console.error);
            });
        }).catch(function (err) {
            console.error('[CV] getClientsInThisBoard FAILED:', err && err.message ? err.message : err);
        });
    };
})();
