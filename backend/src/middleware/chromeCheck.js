/**
 * Chrome Enforcement Middleware
 * Verifies that the request is coming from Google Chrome.
 * Blocks Edge, Opera, and other Chromium-based browsers if possible.
 */
module.exports = (req, res, next) => {
    // 1. Check User Agent
    const ua = req.headers['user-agent'] || '';
    
    // Basic User Agent Checks
    const isChrome = /Chrome/.test(ua) && /Google Inc/.test(ua); // Typical Chrome signal (vendor not always in UA string though, careful)
    const isEdge = /Edg/.test(ua);
    const isOpera = /OPR/.test(ua) || /Opr/.test(ua);

    // Note: Node.js express req doesn't have navigator.vendor
    // But 'user-agent' for strict Chrome usually contains "Chrome/... Safari/..." and NOT "Edg/..."

    // 2. Client Hints (sec-ch-ua) - STRONGER CHECK
    // Format example: "Google Chrome";v="119", "Chromium";v="119", "Not?A_Brand";v="24"
    const clientHints = req.headers['sec-ch-ua'];
    
    let isStrictChrome = false;

    if (clientHints) {
        // Check if "Google Chrome" is present and "Microsoft Edge" is NOT
        const hasGoogleChrome = /"Google Chrome"/.test(clientHints);
        const hasEdge = /"Microsoft Edge"/.test(clientHints) || /"Edg"/.test(clientHints);
        
        if (hasGoogleChrome && !hasEdge) {
            isStrictChrome = true;
        }
    } else {
        // Fallback to User Agent if Client Hints missing (older browsers or stripped)
        // Strictly block legacy UA strings known to be Edge/Opera
        if (/Chrome/.test(ua) && !isEdge && !isOpera) {
            isStrictChrome = true;
        }
    }

    if (!isStrictChrome) {
        console.warn(`[Security] Blocked non-Chrome request: ${ua} | Hints: ${clientHints}`);
        return res.status(403).json({
            success: false,
            error: 'Access Denied. Strict Google Chrome enforcement is active.',
            code: 'BROWSER_NOT_SUPPORTED',
            details: {
                ua: ua,
                hints: clientHints || 'None'
            }
        });
    }

    next();
};
