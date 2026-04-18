type AuthCallback = (state: boolean) => void;

class AuthEvents {
    private listeners: AuthCallback[] = [];

    subscribe(callback: AuthCallback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(i => i !== callback);
        };
    }

    emitLogout() {
        this.listeners.forEach(callback => callback(false));
    }
    
    emitLogin() {
        this.listeners.forEach(callback => callback(true));
    }
}

export const authEvents = new AuthEvents();
