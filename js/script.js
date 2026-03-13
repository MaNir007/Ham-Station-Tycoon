document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const creditsDisp = document.getElementById('credits-disp');
    const xpDisp = document.getElementById('xp-disp');
    const licenseDisp = document.getElementById('license-disp');
    const multiplierDisp = document.getElementById('multiplier-disp');
    const logWindow = document.getElementById('log-window');
    const btnScan = document.getElementById('scan-btn');
    const shopContainer = document.getElementById('shop-items');

    // Game State
    let state = {
        credits: 0,
        xp: 0,
        license: 'Novice',
        multiplier: 1.0,
        inventory: [],
        shop: []
    };

    let isScanning = false;

    // Helper: Add log message
    function log(msg, color = 'var(--text-color)') {
        const time = new Date().toLocaleTimeString('en-US', { hour12: false });
        const span = document.createElement('span');
        span.style.color = color;
        span.innerHTML = `[${time}] ${msg}<br>`;
        logWindow.appendChild(span);
        logWindow.scrollTop = logWindow.scrollHeight;
    }

    // Update UI
    function updateUI() {
        creditsDisp.innerText = state.credits;
        xpDisp.innerText = state.xp;
        licenseDisp.innerText = state.license;
        multiplierDisp.innerText = state.multiplier.toFixed(1);
        renderShop();
    }

    // Fetch initial data
    async function fetchGameData() {
        try {
            const res = await fetch('php/api.php?action=get_data');
            const data = await res.json();
            if (data.status === 'success') {
                state.credits = parseInt(data.user.credits);
                state.xp = parseInt(data.user.xp);
                state.license = data.user.license;
                state.multiplier = parseFloat(data.user.multiplier);
                state.shop = data.shop;
                state.inventory = data.inventory.map(id => parseInt(id));
                updateUI();
                log('> Connection established. Data sync complete.');
            } else {
                log('> Error syncing data: ' + data.message, 'var(--danger)');
            }
        } catch (err) {
            log('> Critical connection error.', 'var(--danger)');
        }
    }

    // Save progress to server
    async function saveProgress(c_add, x_add) {
        try {
            const payload = { credits: c_add, xp: x_add };
            const res = await fetch('php/api.php?action=save_progress', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            if (data.status !== 'success') {
                log('> Warning: Sync failed.', 'var(--danger)');
            }
        } catch (err) {
            log('> Warning: Server timeout.', 'var(--danger)');
        }
    }

    // Buy Item Action
    async function buyItem(itemId) {
        try {
            btnScan.disabled = true; // prevent abuse
            const res = await fetch('php/api.php?action=buy_item', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ item_id: itemId })
            });
            const data = await res.json();
            
            if (data.status === 'success') {
                log(`> SUCC: Equipment purchased and installed.`, 'var(--highlight)');
                await fetchGameData(); // refresh full state
            } else {
                log(`> ERR: ${data.message}`, 'var(--danger)');
            }
        } catch (err) {
            log('> ERR: Transaction failed.', 'var(--danger)');
        } finally {
            btnScan.disabled = false;
        }
    }

    // Render shop
    function renderShop() {
        shopContainer.innerHTML = '';
        
        const hierarchy = { 'Novice': 1, 'Class P': 2, 'Class A': 3 };
        const userLevel = hierarchy[state.license] || 1;

        state.shop.forEach(item => {
            const reqLevel = hierarchy[item.required_class] || 1;
            const isOwned = state.inventory.includes(parseInt(item.id));
            const canAfford = state.credits >= parseInt(item.price);
            const hasLicense = userLevel >= reqLevel;

            const div = document.createElement('div');
            div.className = 'shop-item';
            
            let btnState = '';
            let btnText = 'PURCHASE';
            
            if (isOwned) {
                btnState = 'disabled';
                btnText = 'OWNED';
            } else if (!hasLicense) {
                btnState = 'disabled';
                btnText = 'REQ: ' + item.required_class;
            } else if (!canAfford) {
                btnState = 'disabled';
                btnText = 'INSUFFICIENT FUNDS';
            }

            div.innerHTML = `
                <h3>${item.name}</h3>
                <div class="shop-item-details">
                    <div>Type: ${item.type}</div>
                    <div>Bonus: +${item.bonus_multiplier}x</div>
                    <div>Price: ${item.price} CR</div>
                </div>
                <button class="btn buy-btn" onclick="window.buyItemReq(${item.id})" ${btnState}>${btnText}</button>
            `;
            shopContainer.appendChild(div);
        });
    }

    // Expose buy to window for inline onclick
    window.buyItemReq = function(id) {
        buyItem(id);
    };

    // Main Gameplay Action: Scan
    btnScan.addEventListener('click', () => {
        if (isScanning) return;
        
        isScanning = true;
        btnScan.disabled = true;
        btnScan.innerText = "SCANNING...";
        log('> Tuning frequency... scanning bands...');

        // Simulate delay
        setTimeout(() => {
            const success = Math.random() > 0.3; // 70% chance to find a signal

            if (success) {
                const baseCredits = Math.floor(Math.random() * 10) + 5;
                const earnedCredits = Math.floor(baseCredits * state.multiplier);
                const earnedXp = Math.floor(Math.random() * 5) + 2;

                log(`> SIGNAL FOUND! CQ CQ CQ... Established contact.`, 'var(--highlight)');
                log(`> +${earnedCredits} CR | +${earnedXp} XP`);

                state.credits += earnedCredits;
                state.xp += earnedXp;
                
                updateUI();
                saveProgress(earnedCredits, earnedXp);
                
                // Check if we passed a threshold locally just to update text quickly,
                // server will handle actual promotion next reload or buy
                if (state.xp >= 500 && state.license === 'Novice') {
                    state.license = 'Class P';
                    log('> PROMOTION! Upgraded to Class P license!', 'var(--highlight)');
                    updateUI();
                } else if (state.xp >= 2000 && state.license === 'Class P') {
                    state.license = 'Class A';
                    log('> PROMOTION! Upgraded to Class A license!', 'var(--highlight)');
                    updateUI();
                }
                
            } else {
                log('> Static... no signal found on this frequency.');
            }

            isScanning = false;
            btnScan.disabled = false;
            btnScan.innerText = "SCAN FREQUENCIES";
        }, 1500); // 1.5s scan time
    });

    // Init
    if (logWindow) {
        fetchGameData();
    }
});
