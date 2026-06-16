const authenticate = (thisObject, args) => {
    if (!thisObject.keepAllowingAuthBlock) { // user closed popup before it was finished
        if (!thisObject.disableConfirmationShown) { // we didnt ask them to confirm yet or they only declined it once, so we let them know every time
            const areYouSure = true;
            if (!areYouSure) { // they clicked no, dont show confirmation again
                thisObject.disableConfirmationShown = true;
                return "The user has declined the ability to authenticate.";
            }
        } else { // they already clicked no before
            return "The user has declined the ability to authenticate.";
        }
    }
    return new Promise(resolve => {
        const sanitizedName = encodeURIComponent(String(args.NAME).substring(0, 256).replace(/[^a-zA-Z0-9 _-]+/gmi, "_"));
        const waitingLink = `${window.location.origin}/wait.html`;
        const login = window.open(
            `https://auth.itinerary.eu.org/auth/?redirect=${btoa(waitingLink)}&name=${sanitizedName.length > 0 ? sanitizedName : "PatternYard"}`,
            "Scratch Authentication",
            `scrollbars=yes,resizable=yes,status=no,location=yes,toolbar=no,menubar=no,width=768,height=512,left=200,top=200`
        );
        if (!login) {
            resolve("Authentication failed to appear."); // popup was blocked most likely
            // reminder for future me to make an iframe appear if the window failed to appear
        }
        let cantAccessAnymore = false;
        let finished = false; // finished will be set to true if we got the username or something went wrong
        let interval = null; // goofy activity
        interval = setInterval(() => {
            if (login?.closed && (!finished)) {
                thisObject.keepAllowingAuthBlock = false;
                clearInterval(interval);
                try {
                    login.close();
                } catch {
                    // what a shame we couldnt close the window that doesnt exist anymore
                }
                resolve("");
            }
            try {
                const query = login.location.search;
                if (!cantAccessAnymore) return;
                const parameters = new URLSearchParams(query);
                const privateCode = parameters.get("privateCode");
                if (!privateCode) {
                    finished = true;
                    clearInterval(interval);
                    login.close();
                    resolve("");
                }
                clearInterval(interval);
                fetch(`https://pm-bapi.vercel.app/api/verifyToken?privateCode=${privateCode}`).then(res => res.json().then(json => {
                    finished = true;
                    login.close();
                    if (json.valid != true) {
                        resolve("");
                    }
                    resolve(String(json.username));
                })
                    .catch(() => {
                        finished = true;
                        login.close();
                        resolve("");
                    }))
                    .catch(() => {
                        finished = true;
                        login.close();
                        resolve("");
                    });
            } catch {
                // due to strange chrome bug, window still has the previous url on it so we need to wait until we switch to the auth site
                cantAccessAnymore = true;
                // now we cant access the location yet since the user hasnt left the authentication site
            }
        }, 10);
    });
};

module.exports = {
    authenticate
}