// ui.js
// Sistema visual único para mensagens e confirmações do Sertonibus.

(() => {
    const icons = { error: '!', success: '✓', warning: '!', info: 'i' };
    const titles = {
        error: 'Não foi possível concluir',
        success: 'Tudo certo',
        warning: 'Atenção',
        info: 'Informação'
    };

    const showToast = (message, type = 'info', duration = 4200) => {
        let container = document.getElementById('sertonibus-toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'sertonibus-toast-container';
            container.className = 'sertonibus-toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = 'sertonibus-toast sertonibus-toast-' + type;
        toast.setAttribute('role', type === 'error' ? 'alert' : 'status');

        const icon = document.createElement('span');
        icon.className = 'sertonibus-toast-icon';
        icon.textContent = icons[type] || icons.info;

        const content = document.createElement('div');
        content.className = 'sertonibus-toast-content';
        const title = document.createElement('strong');
        title.textContent = titles[type] || titles.info;
        const text = document.createElement('span');
        text.textContent = message;

        const close = document.createElement('button');
        close.type = 'button';
        close.className = 'sertonibus-toast-close';
        close.setAttribute('aria-label', 'Fechar');
        close.textContent = '×';

        content.append(title, text);
        toast.append(icon, content, close);
        container.appendChild(toast);

        requestAnimationFrame(() => toast.classList.add('is-visible'));

        let closed = false;
        const remove = () => {
            if (closed) return;
            closed = true;
            toast.classList.remove('is-visible');
            toast.classList.add('is-closing');
            setTimeout(() => toast.remove(), 280);
        };

        close.addEventListener('click', remove);
        if (duration > 0) setTimeout(remove, duration);
        return toast;
    };

    const confirmAction = (message, options = {}) => new Promise(resolve => {
        const titleText = options.title || 'Confirmar ação';
        const confirmText = options.confirmText || 'Confirmar';
        const cancelText = options.cancelText || 'Voltar';
        const danger = options.danger !== false;

        const overlay = document.createElement('div');
        overlay.className = 'sertonibus-confirm-overlay';

        const modal = document.createElement('div');
        modal.className = 'sertonibus-confirm-modal';

        const icon = document.createElement('div');
        icon.className = 'sertonibus-confirm-icon';
        icon.textContent = danger ? '!' : '?';

        const title = document.createElement('h2');
        title.textContent = titleText;

        const messageElement = document.createElement('p');
        messageElement.textContent = message;

        const actions = document.createElement('div');
        actions.className = 'sertonibus-confirm-actions';

        const cancel = document.createElement('button');
        cancel.type = 'button';
        cancel.className = 'sertonibus-confirm-cancel';
        cancel.textContent = cancelText;

        const confirm = document.createElement('button');
        confirm.type = 'button';
        confirm.className = 'sertonibus-confirm-ok' + (danger ? ' danger' : '');
        confirm.textContent = confirmText;

        actions.append(cancel, confirm);
        modal.append(icon, title, messageElement, actions);

        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        requestAnimationFrame(() => overlay.classList.add('is-visible'));

        const finish = result => {
            overlay.classList.remove('is-visible');
            setTimeout(() => overlay.remove(), 260);
            resolve(result);
        };

        modal.querySelector('.sertonibus-confirm-cancel').addEventListener('click', () => finish(false));
        modal.querySelector('.sertonibus-confirm-ok').addEventListener('click', () => finish(true));
        overlay.addEventListener('click', event => {
            if (event.target === overlay) finish(false);
        });
    });

    const setFieldState = (input, state = 'normal') => {
        if (!input) return;
        input.classList.remove('sertonibus-field-error', 'sertonibus-field-success');
        if (state === 'error') input.classList.add('sertonibus-field-error');
        if (state === 'success') input.classList.add('sertonibus-field-success');
    };

    window.SertonibusUI = { showToast, confirmAction, setFieldState };
    window.alert = message => showToast(String(message), 'error');
})();
