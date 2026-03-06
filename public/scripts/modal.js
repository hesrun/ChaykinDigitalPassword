// API:
//   Modal.open('id')
//   Modal.close('id')
//   Modal.closeAll()
//
// Декларативно:
//   <button data-modal-open="id">
//   <button data-modal-close="id">

(() => {
    const BASE_Z = 300;
    const Z_STEP = 10;

    // [{ id, rootEl, panelEl, backdropEl }]
    const stack = [];

    /* ─── Открыть ─── */
    function open(id) {
        const rootEl = document.querySelector(`[data-modal-id="${id}"]`);

        if (!rootEl) {
            console.warn(`Modal: модалка "${id}" не найдена`);
            return;
        }
        if (stack.find((s) => s.id === id)) return;

        const backdropEl = rootEl.querySelector("[data-modal-backdrop]");
        const panelEl = rootEl.querySelector("[data-modal-panel]");

        const idx = stack.length;
        rootEl.style.zIndex = BASE_Z + idx * Z_STEP;

        if (!rootEl.dataset.modalInitialized) {
            backdropEl.addEventListener("click", () => close(id));
            rootEl.dataset.modalInitialized = "1";
        }

        stack.push({ id, rootEl, panelEl, backdropEl });

        rootEl.classList.add("modal--open");

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                backdropEl.classList.add("modal__backdrop--visible");
                panelEl.classList.add("modal__content--open");
            });
        });
    }

    /* ─── Закрыть ─── */
    function close(id) {
        const idx = stack.findIndex((s) => s.id === id);
        if (idx === -1) return;

        const { rootEl, panelEl, backdropEl } = stack[idx];
        stack.splice(idx, 1);

        panelEl.classList.remove("modal__content--open");
        panelEl.classList.add("modal__content--closing");
        backdropEl.classList.remove("modal__backdrop--visible");

        const cleanup = () => {
            panelEl.classList.remove("modal__content--closing");
            rootEl.classList.remove("modal--open");
        };
        panelEl.addEventListener("transitionend", cleanup, { once: true });
        setTimeout(cleanup, 400);
    }

    function closeAll() {
        [...stack].reverse().forEach((s) => close(s.id));
    }

    /* ─── Глобальный API ─── */
    window.Modal = { open, close, closeAll };

    /* ─── Декларативные атрибуты ─── */
    document.addEventListener("click", (e) => {
        const opener = e.target.closest("[data-modal-open]");
        if (opener) {
            e.preventDefault();
            open(opener.dataset.modalOpen);
        }

        const closer = e.target.closest("[data-modal-close]");
        if (closer) {
            e.preventDefault();
            close(closer.dataset.modalClose);
        }
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && stack.length > 0)
            close(stack[stack.length - 1].id);
    });
})();
