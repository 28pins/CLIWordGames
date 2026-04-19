/// MARK: -
const escapeHTML = (s) => {
    let out = String(s == null ? '' : s)
    if (out.includes('<script') || out.includes('javascript:')) return ''; // basic XSS filter
    if (out.includes('&')) out = out.split('&').join('&amp;');
    if (out.includes('onclick')) return 'Error: Invalid input';
    if (out.includes('onerror')) return 'Error: Invalid input';
    if (out.includes('onload')) return 'Error: Invalid input';
    if (out.includes('onmouseover')) return 'Error: Invalid input';
    return out
}

const consolePort = {
    log(...args) {
        const game = document.getElementById('game');
        if (!game) return;
        for (let a of args) {
            let s = String(a == null ? '' : a);
            s = s.split('\n').join('<br>');
            // replace spaces only outside of tags to avoid breaking HTML
            let out = '';
            let inTag = false;
            for (let i = 0; i < s.length; i++) {
                const ch = s.charAt(i);
                if (ch === '<') { inTag = true; out += ch; continue; }
                if (ch === '>') { inTag = false; out += ch; continue; }
                out += (!inTag && ch === ' ') ? '&nbsp;' : ch;
            }
            game.innerHTML += out;
        }
    },
    clear() { const g = document.getElementById('game'); if (g) g.innerHTML = ''; }
}

/// MARK: - chalk
let paddingAdd = "0px 0px" // 0px high 0px wide
//if url contains "words" (for words.js) then add vertical padding for better spacing, but not for categories in connections
if (window.location.href.includes('words')) {
    paddingAdd = "2px 4px" // 2px high 0px wide
}
const chalkPort = {
    //Padding on Words, no padding on categories
    bold: t => `<b>${escapeHTML(t)}</b>`,
    blue: t => `<span style="color: #0074D9; padding: ${paddingAdd};">${escapeHTML(t)}</span>`,
    red: t => `<span style="color: #FF4136; padding: ${paddingAdd};">${escapeHTML(t)}</span>`,
    yellow: t => `<span style="color: #FFDC00; padding: ${paddingAdd};">${escapeHTML(t)}</span>`,
    green: t => `<span style="color: #2ECC40; padding: ${paddingAdd};">${escapeHTML(t)}</span>`,
    white: t => `<span style="color: #FFFFFF; padding: ${paddingAdd};">${escapeHTML(t)}</span>`,
    bgGray: t => `<span style="background-color: #AAAAAA; color: #000000; border-radius: 4px; padding: ${paddingAdd};">${escapeHTML(t)}</span>`,
    bgRedBright: t => `<span style="background-color: #FF4136; color: #FFFFFF; border-radius: 4px; padding: ${paddingAdd};">${escapeHTML(t)}</span>`,
    bgGreen: t => `<span style="background-color: #2ECC40; color: #000000; border-radius: 4px; padding: ${paddingAdd};">${escapeHTML(t)}</span>`,
    bgYellow: t => `<span style="background-color: #FFDC00; color: #000000; border-radius: 4px; padding: ${paddingAdd};">${escapeHTML(t)}</span>`,
    bgBlue: t => `<span style="background-color: #0074D9; color: #000000; border-radius: 4px; padding: ${paddingAdd};">${escapeHTML(t)}</span>`,
    bgMagenta: t => `<span style="background-color: #FF00FF; color: #000000; border-radius: 4px; padding: ${paddingAdd};">${escapeHTML(t)}</span>`,
    gray: t => `<span style="color: #AAAAAA; padding: ${paddingAdd};">${escapeHTML(t)}</span>`,
    black: t => `<span style="color: #111111; padding: ${paddingAdd};">${escapeHTML(t)}</span>`,
    bgHex: color => t => `<span style="background-color: ${String(color)}; color: #000000; border-radius: 4px; padding: ${paddingAdd};">${escapeHTML(t)}</span>`
};

/// MARK: - inquirerPort
let inquirerPortIsPrompting = false;
const inquirerPort = {
    promptForWord(message) {
        inquirerPortIsPrompting = true;
        const game = document.getElementById('game');
        if (!game) return Promise.resolve('');
        game.innerHTML += '<br>' + escapeHTML(message) + ' ';
        const input = document.createElement('span');
        input.className = 'inquirer-input';
        game.appendChild(input);

        return new Promise((resolve) => {
            const onSubmit = () => {
                window.removeEventListener('inquirerSubmit', onSubmit);
                window.removeEventListener('keydown', handleKey);
                inquirerPortIsPrompting = false;
                if (input.parentNode) input.parentNode.removeChild(input);
                resolve(input.textContent || '');
            };

            const handleKey = (event) => {
                if (!inquirerPortIsPrompting) return;
                const key = event.key;
                if (key === 'Enter') {
                    try { window.dispatchEvent(new CustomEvent('inquirerSubmit')); } catch (e) { }
                } else if (key === 'Backspace') {
                    input.textContent = (input.textContent || '').slice(0, -1);
                } else {
                    // allow A-Z letters only
                    if (key.length === 1 && key.match(/[a-zA-Z]/)) input.textContent = (input.textContent || '') + key;
                }
            };

            window.addEventListener('inquirerSubmit', onSubmit);
            window.addEventListener('keydown', handleKey);
        });
    }
};