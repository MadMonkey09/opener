(function () {
    'use strict';

    if (window.__bubbleOpenerLoaded) return;
    window.__bubbleOpenerLoaded = true;

    let isOpening = false;
    let resultMap = {};

    // Floting button
    const toggleBtn = document.createElement('div');
    Object.assign(toggleBtn.style, {
        position: 'fixed',
        bottom: '30px',
        right: '30px',
        width: '55px',
        height: '55px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg,#33f2ff,#55aaff)',
        boxShadow: '0 0 15px #33eaff',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontSize: '26px',
        fontWeight: '900',
        zIndex: 9999,
        userSelect: 'none'
    });
    toggleBtn.textContent = '⚡';
    document.body.appendChild(toggleBtn);

    // Bubble UI container
    const ui = document.createElement('div');
    Object.assign(ui.style, {
        position: 'fixed',
        bottom: '95px',
        right: '30px',
        width: '180px',
        padding: '12px',
        background: 'rgba(12,20,40,0.92)',
        border: '2px solid #33eaff',
        borderRadius: '12px',
        boxShadow: '0 0 15px #33eaff',
        display: 'none',
        flexDirection: 'column',
        gap: '8px',
        color: '#b7faff',
        fontFamily: 'Arial',
        zIndex: 9998
    });
    document.body.appendChild(ui);

    // Pack selector (filtered)
    const packSelect = document.createElement('select');
    Object.assign(packSelect.style, {
        width: '100%',
        padding: '5px',
        borderRadius: '6px',
        border: '1px solid #33eaff',
        background: 'rgba(0,0,0,0.35)',
        color: '#b7faff'
    });
    ui.appendChild(packSelect);

    // Amount input
    const amtInput = document.createElement('input');
    amtInput.type = 'number';
    amtInput.min = 1;
    amtInput.value = 1;
    Object.assign(amtInput.style, {
        width: '65px',
        padding: '5px',
        borderRadius: '6px',
        border: '1px solid #33eaff',
        background: 'rgba(0,0,0,0.35)',
        color: '#b7faff',
        textAlign: 'center'
    });
    ui.appendChild(amtInput);

    // Open button
    const openBtn = document.createElement('button');
    openBtn.textContent = 'Open';
    Object.assign(openBtn.style, {
        width: '100%',
        padding: '7px 0',
        borderRadius: '6px',
        border: 'none',
        background: 'linear-gradient(135deg,#33eaff,#5588ff)',
        color: '#fff',
        cursor: 'pointer',
        fontWeight: '700'
    });
    ui.appendChild(openBtn);

    // Result stack
    const stack = document.createElement('div');
    Object.assign(stack.style, {
        position: 'fixed',
        bottom: '280px',
        right: '30px',
        width: '180px',
        maxHeight: '260px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column-reverse',
        gap: '5px',
        zIndex: 9997
    });
    document.body.appendChild(stack);

    // Toggle panel
    let open = false;
    toggleBtn.onclick = () => {
        open = !open;
        ui.style.display = open ? 'flex' : 'none';
    };

    // Filter only active packs
    function loadPacks() {
        packSelect.innerHTML = '';
        Object.keys(blacket.packs).forEach(p => {
            const data = blacket.packs[p];
            if (data?.price && data?.price > 0 && !data.disabled && data.enabled !== false) {
                const opt = document.createElement('option');
                opt.value = p;
                opt.textContent = p;
                packSelect.appendChild(opt);
            }
        });
    }
    loadPacks();

    // Blook card creation
    function addBlook(name) {
        const info = blacket.blooks[name] || {};
        const img = info.image || '/content/blooks/Error.webp';
        const rarity = info.rarity || 'Common';
        const color = blacket.rarities[rarity]?.color || '#33eaff';

        let card;
        if (!resultMap[name]) {
            card = document.createElement('div');
            Object.assign(card.style, {
                height: '38px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px',
                background: 'rgba(0,0,0,0.4)',
                borderRadius: '6px',
                border: `1px solid ${color}`,
                color: color,
                fontWeight: '700',
                fontSize: '0.9rem',
                opacity: 0,
                transform: 'translateX(25px)',
                transition: '0.25s'
            });

            card.innerHTML =
                `<img src="${img}" style="width:30px;height:30px;border-radius:4px;box-shadow:0 0 6px ${color}">` +
                `<span>${name} (1)</span>`;

            resultMap[name] = { count: 1, element: card };
            stack.appendChild(card);

            requestAnimationFrame(() => {
                card.style.opacity = 1;
                card.style.transform = 'translateX(0)';
            });
        } else {
            resultMap[name].count++;
            resultMap[name].element.querySelector('span').textContent =
                `${name} (${resultMap[name].count})`;
        }
    }

    // Opening logic
    function openPack(pack) {
        return new Promise(res => {
            blacket.requests.post('/worker3/open', { pack }, data => {
                if (data.error) return res(null);
                blacket.user.tokens -= blacket.packs[pack].price;
                res(data.blook);
            });
        });
    }

    async function runOpen(pack, count) {
        if (isOpening) return;
        isOpening = true;
        resultMap = {};
        stack.innerHTML = '';

        for (let i = 0; i < count; i++) {
            const blook = await openPack(pack);
            if (blook) addBlook(blook);
            await new Promise(r => setTimeout(r, 45));
        }
        isOpening = false;
    }

    // Open button click
    openBtn.onclick = () => {
        const pack = packSelect.value;
        const amt = parseInt(amtInput.value);
        const price = blacket.packs[pack].price;
        const max = Math.floor(blacket.user.tokens / price);

        if (amt < 1 || amt > max) {
            return alert(`You can afford ${max} packs.`);
        }

        runOpen(pack, amt);
    };

})();
