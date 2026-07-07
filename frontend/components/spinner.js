(function() {
    if (document.getElementById("spinner-injected")) return;
    const style = document.createElement("style");
    style.id = "spinner-injected";
    style.textContent = `
        .spinner-wrapper {
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 40px;
            width: 100%;
        }
        .spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #2b2142;
            border-top: 4px solid #b388ff;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
        }
        .spinner-overlay {
            position: fixed;
            inset: 0;
            z-index: 9999;
            display: flex;
            justify-content: center;
            align-items: center;
            background: rgba(10, 10, 20, 0.6);
            backdrop-filter: blur(2px);
        }
        .spinner-overlay .spinner {
            width: 48px;
            height: 48px;
            border-width: 5px;
            border-color: #1e1e2e;
            border-top-color: #4ade80;
        }
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
    `;
    document.head.appendChild(style);
})();

function showSpinner(containerId) {
    if (!containerId) {
        const overlay = document.createElement("div");
        overlay.className = "spinner-overlay";
        overlay.id = "spinner-overlay";
        overlay.innerHTML = '<div class="spinner"></div>';
        document.body.appendChild(overlay);
        return;
    }
    const container = document.getElementById(containerId);
    if (!container) return;
    container.style.position = "relative";
    const wrapper = document.createElement("div");
    wrapper.className = "spinner-wrapper";
    wrapper.id = "spinner-" + containerId;
    wrapper.innerHTML = '<div class="spinner"></div>';
    wrapper.style.cssText = "position:absolute;inset:0;z-index:10;display:flex;justify-content:center;align-items:center;padding:40px;background:rgba(10,10,20,0.6);border-radius:inherit;";
    container.appendChild(wrapper);
}

function hideSpinner(containerId) {
    if (!containerId) {
        const el = document.getElementById("spinner-overlay");
        if (el) el.remove();
        return;
    }
    const el = document.getElementById("spinner-" + containerId);
    if (el) el.remove();
}
