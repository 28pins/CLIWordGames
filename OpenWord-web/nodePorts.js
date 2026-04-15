const consolePort = {
    log : function(...arg) {
        for ( let i = 0; i < arg.length; i++ ) {
            arg[i] = arg[i].replace('/n', '<br>');
            arg[i] = arg[i].replace(' ', '&nbsp;');
        }
        document.getElementById('game').innerHTML += arg.join(' ') + '\n';
    },
    clear : function() {
        document.getElementById('game').innerHTML = '';
    }
}
const chalkPort = {
    blue : function(text) {
        return `<span style="color: #0074D9">${text}</span>`;
    },
    yellow : function(text) {
        return `<span style="color: #FFDC00">${text}</span>`;
    },
    green : function(text) {
        return `<span style="color: #2ECC40">${text}</span>`;
    },
    white : function(text) {
        return `<span style="color: #FFFFFF">${text}</span>`;
    },
    bgGreen : function(text) {
        return `<span style="background-color: #2ECC40; color: #000000;">${text}</span>`;
    },
    gray : function(text) {
        return `<span style="color: #AAAAAA">${text}</span>`;
    },
    black : function(text) {
        return `<span style="color: #111111">${text}</span>`;
    },
    bgHex : function(color) {
        return function(text) {
            return `<span style="background-color: ${color}; color: #000000;">${text}</span>`;
        };
    }
}
// sanitize text coming from the pseudo-input to mitigate XSS
function sanitizeInput(str) {
    if (!str) return '';
    // keep only letters and spaces, collapse whitespace, trim
    const cleaned = String(str).replace(/[^a-zA-Z\s]/g, '');
    return cleaned.replace(/\s+/g, ' ').trim();
}
window.addEventListener('keydown', function(event) {
    if ( inquirerPortIsPrompting ) {
        const key = event.key;
        if ( key === 'Enter' ) {
            inquirerPortSubmit();
        } else if ( key === 'Backspace' ) {
            inquirerPortBackspace();
        } else if ( /^[a-zA-Z]$/.test(key) ) {
            inquirerPortAddLetter(key);
        }
    }
});
function inquirerPortSubmit() {
    inquirerPortIsPrompting = false;
    // notify any waiting prompt that input was submitted
    try {
        window.dispatchEvent(new CustomEvent('inquirerSubmit'));
    } catch (e) {
        // ignore if CustomEvent is not supported (very old browsers)
    }
}
function inquirerPortBackspace() {
    const input = document.getElementsByClassName('inquirer-input')[0];
    if ( input ) {
        input.textContent = (input.textContent || '').slice(0, -1);
    }
}
function inquirerPortAddLetter(letter) {
    const input = document.getElementsByClassName('inquirer-input')[0];
    if ( letter.length !== 1 || !/^[a-zA-Z]$/.test(letter) ) { return; }
    if ( input ) {
        input.textContent = (input.textContent || '') + letter;
    } else {
        const newInput = document.getElementById('game').appendChild(document.createElement('span'));
        newInput.className = 'inquirer-input';
        newInput.textContent = letter;
    }
}
let inquirerPortIsPrompting = false;
const inquirerPort = {
    promptForWord : function(message) {
        inquirerPortIsPrompting = true;
        const game = document.getElementById('game');
        game.innerHTML += message + ' ';
        const input = document.createElement('span');
        input.className = 'inquirer-input';
        game.appendChild(input);

        return new Promise((resolve) => {
            const onSubmit = () => {
                window.removeEventListener('inquirerSubmit', onSubmit);
                inquirerPortIsPrompting = false;
                // capture and sanitize, then remove the input element
                const raw = input.textContent || '';
                const value = sanitizeInput(raw);
                if (input.parentNode) input.parentNode.removeChild(input);
                resolve(value);
            };
            window.addEventListener('inquirerSubmit', onSubmit);
        });
    }
};