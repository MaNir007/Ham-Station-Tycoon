document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const creditsDisp = document.getElementById('credits-disp');
    const xpDisp = document.getElementById('xp-disp');
    const licenseDisp = document.getElementById('license-disp');
    const multiplierDisp = document.getElementById('multiplier-disp');
    const logWindow = document.getElementById('log-window');
    const btnScan = document.getElementById('scan-btn');
    const shopContainer = document.getElementById('shop-items');
    
    // Dyn UI
    const tuneKnob = document.getElementById('tune-knob');
    const freqDisplay = document.getElementById('freq-display');
    const bandIndicator = document.getElementById('band-indicator');
    const freqScreenContainer = document.getElementById('freq-screen-container');
    const leds = [
        document.getElementById('led-1'),
        document.getElementById('led-2'),
        document.getElementById('led-3'),
        document.getElementById('led-4'),
        document.getElementById('led-5')
    ];
    const sMeterNeedle = document.getElementById('s-meter-needle');
    const volKnob = document.getElementById('vol-knob');
    const sqlKnob = document.getElementById('sql-knob');

    // Aux Knobs Logic
    function setupKnob(knobEl, labelMsg) {
        if (!knobEl) return;
        let isDragging = false;
        let lastY = 0;
        let angle = 0;

        knobEl.addEventListener('mousedown', (e) => {
            isDragging = true;
            lastY = e.clientY;
        });

        window.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            let deltaY = lastY - e.clientY;
            lastY = e.clientY;
            
            if (deltaY !== 0) {
                angle += deltaY * 2;
                if(angle < -135) angle = -135;
                if(angle > 135) angle = 135;
                knobEl.style.transform = `rotate(${angle}deg)`;
            }
        });

        window.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                log(`> ${labelMsg} adjusted.`);
            }
        });
        
        knobEl.addEventListener('wheel', (e) => {
            e.preventDefault();
            let deltaY = e.deltaY;
            angle += (deltaY < 0 ? 10 : -10);
            if(angle < -135) angle = -135;
            if(angle > 135) angle = 135;
            knobEl.style.transform = `rotate(${angle}deg)`;
            log(`> ${labelMsg} adjusted.`);
        });
    }

    setupKnob(volKnob, "Volume");
    setupKnob(sqlKnob, "Squelch");

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
    let currentMode = 'FM';
    const modeBtns = document.querySelectorAll('.mode-btn');

    function setMode(mode, silent = false) {
        currentMode = mode;
        modeBtns.forEach(b => {
            if(b.getAttribute('data-mode') === mode) {
                b.classList.add('active');
            } else {
                b.classList.remove('active');
            }
        });
        if (!silent) log(`> Mode switched to ${mode}.`);
    }

    modeBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (isScanning) return;
            setMode(e.target.getAttribute('data-mode'));
        });
    });

    // Band data tracking
    const bandsData = [
        { name: '2m', min: 144.000, max: 148.000, step: 0.005 },
        { name: '40m', min: 7.000, max: 7.300, step: 0.001 },
        { name: '20m', min: 14.000, max: 14.350, step: 0.001 },
        { name: '80m', min: 3.500, max: 4.000, step: 0.001 },
        { name: '15m', min: 21.000, max: 21.450, step: 0.001 },
        { name: '10m', min: 28.000, max: 29.700, step: 0.005 }
    ];

    let currentBandIndex = 0;
    let currentFreq = bandsData[0].min;
    let allowedBands = [0];

    function getAllowedBands() {
        if (state.license === 'Novice') return [0];
        if (state.license === 'Class P') return [0, 1, 2];
        return [0, 1, 2, 3, 4, 5];
    }

    function updateBandLimits() {
        if (!bandIndicator) return;
        allowedBands = getAllowedBands();
        if (!allowedBands.includes(currentBandIndex)) {
            currentBandIndex = allowedBands[0];
            currentFreq = bandsData[currentBandIndex].min;
        }
        let b = bandsData[currentBandIndex];
        bandIndicator.innerText = b.name + " BAND";
        updateFreqDisplay();
    }

    function updateFreqDisplay() {
        if (!freqDisplay) return;
        freqDisplay.innerText = currentFreq.toFixed(3);
    }
    
    if (freqScreenContainer) {
        freqScreenContainer.addEventListener('click', () => {
            if (isScanning) return;
            let bIndex = allowedBands.indexOf(currentBandIndex);
            bIndex = (bIndex + 1) % allowedBands.length;
            currentBandIndex = allowedBands[bIndex];
            let b = bandsData[currentBandIndex];
            bandIndicator.innerText = b.name + " BAND";
            currentFreq = b.min + ((b.max - b.min)/2);
            updateFreqDisplay();
            log(`> Switched to ${b.name} band.`, 'var(--primary)');
            
            // Auto Mode Selection based on band
            if (b.name === '2m' || b.name === '10m') setMode('FM', true);
            else if (['40m', '80m'].includes(b.name)) setMode('LSB', true);
            else setMode('USB', true);
        });
    }

    // Knob Logic
    let isDraggingKnob = false;
    let lastY = 0;
    let knobAngle = 0;

    if (tuneKnob) {
        tuneKnob.addEventListener('mousedown', (e) => {
            if (isScanning) return;
            isDraggingKnob = true;
            lastY = e.clientY;
        });

        window.addEventListener('mousemove', (e) => {
            if (!isDraggingKnob) return;
            let deltaY = lastY - e.clientY;
            lastY = e.clientY;
            
            if (deltaY !== 0) {
                let b = bandsData[currentBandIndex];
                currentFreq += (deltaY > 0 ? b.step : -b.step) * Math.abs(deltaY) * 0.2;
                if (currentFreq < b.min) currentFreq = b.max;
                if (currentFreq > b.max) currentFreq = b.min;
                updateFreqDisplay();
                
                knobAngle += deltaY * 2;
                tuneKnob.style.transform = `rotate(${knobAngle}deg)`;
                
                if (Math.random() > 0.8) {
                    freqScreenContainer.classList.add('static-noise');
                    setTimeout(() => freqScreenContainer.classList.remove('static-noise'), 100);
                }
            }
        });

        window.addEventListener('mouseup', () => {
            isDraggingKnob = false;
        });
        
        tuneKnob.addEventListener('wheel', (e) => {
            if (isScanning) return;
            e.preventDefault();
            let deltaY = e.deltaY;
            let b = bandsData[currentBandIndex];
            currentFreq += (deltaY < 0 ? b.step : -b.step) * 2;
            if (currentFreq < b.min) currentFreq = b.max;
            if (currentFreq > b.max) currentFreq = b.min;
            updateFreqDisplay();
            knobAngle += (deltaY < 0 ? 10 : -10);
            tuneKnob.style.transform = `rotate(${knobAngle}deg)`;
        });
    }

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
                updateBandLimits();
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
    if (btnScan) {
        btnScan.addEventListener('click', () => {
            if (isScanning) return;
            
            isScanning = true;
            btnScan.disabled = true;
            btnScan.innerText = "TRANSMITTING...";
            log(`> Transmitting CQ on ${currentFreq.toFixed(3)} MHz [${currentMode}]...`);
            
            // LED effect
            let ledIndex = 0;
            let ledInterval = setInterval(() => {
                leds.forEach(l => { if (l) l.className = 'led'; });
                if(leds[ledIndex]) {
                   leds[ledIndex].classList.add(Math.random() > 0.5 ? 'active-green' : 'active-yellow');
                }
                ledIndex = (ledIndex + 1) % leds.length;
            }, 100);
            
            // Jiggle S-Meter during transmit
            let sMeterInterval = setInterval(() => {
                if(sMeterNeedle) {
                    let jiggleAngle = -45 + (Math.random() * 20); // slight movement near bottom
                    sMeterNeedle.style.transform = `translateX(-50%) rotate(${jiggleAngle}deg)`;
                }
            }, 150);

            // Simulate delay
            setTimeout(() => {
                clearInterval(ledInterval);
                clearInterval(sMeterInterval);
                leds.forEach(l => { if (l) l.className = 'led'; });

                const success = Math.random() > 0.3; // 70% chance to find a signal

                if (success) {
                    const actPanel = document.getElementById('action-panel-dyn');
                    if(actPanel) {
                        actPanel.classList.add('anim-shake');
                        setTimeout(() => actPanel.classList.remove('anim-shake'), 500);
                    }
                    leds.forEach(l => { if (l) l.className = 'led active-green'; });
                    
                    // S-Meter Value picking
                    let sValues = [-15, 0, 15, 30, 45]; // S5, S7, S9, +20, +40
                    let valNames = ['S5', 'S7', 'S9', 'S9+20', 'S9+40'];
                    let sIndex = Math.floor(Math.random() * sValues.length);
                    if(sMeterNeedle) {
                        sMeterNeedle.style.transform = `translateX(-50%) rotate(${sValues[sIndex]}deg)`;
                    }

                    const baseCredits = Math.floor(Math.random() * 10) + 5;
                    const earnedCredits = Math.floor(baseCredits * state.multiplier);
                    const earnedXp = Math.floor(Math.random() * 5) + 2;

                    log(`> SIGNAL FOUND (${valNames[sIndex]})! CQ CQ CQ... Contact established on ${currentFreq.toFixed(3)} MHz [${currentMode}]!`, 'var(--highlight)');
                    log(`> REWARD: +${earnedCredits} CR | +${earnedXp} XP`, 'var(--text-color)');

                    state.credits += earnedCredits;
                    state.xp += earnedXp;
                    
                    updateUI();
                    saveProgress(earnedCredits, earnedXp);
                    
                    if (state.xp >= 500 && state.license === 'Novice') {
                        state.license = 'Class P';
                        log('> PROMOTION! Upgraded to Class P license!', 'var(--highlight)');
                        updateUI();
                        updateBandLimits();
                    } else if (state.xp >= 2000 && state.license === 'Class P') {
                        state.license = 'Class A';
                        log('> PROMOTION! Upgraded to Class A license!', 'var(--highlight)');
                        updateUI();
                        updateBandLimits();
                    }
                    
                } else {
                    leds.forEach(l => { if (l) l.className = 'led active-red'; });
                    log('> Static... no signal found on this frequency.');
                    if(sMeterNeedle) sMeterNeedle.style.transform = `translateX(-50%) rotate(-45deg)`;
                }

                isScanning = false;
                btnScan.disabled = false;
                btnScan.innerText = "TRANSMIT (CQ)";
                
                setTimeout(() => {
                   leds.forEach(l => { if (l) l.className = 'led'; });
                   if(sMeterNeedle) sMeterNeedle.style.transform = `translateX(-50%) rotate(-45deg)`;
                }, 2000);
            }, 1500); // 1.5s scan time
        });
    }

    // Init
    if (logWindow) {
        fetchGameData();
    }
});
