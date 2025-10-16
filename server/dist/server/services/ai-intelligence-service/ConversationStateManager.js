"use strict";
/**
 * Conversation State Manager
 * Manages multi-step conversational flows for AI assistant
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.conversationStateManager = void 0;
class ConversationStateManager {
    constructor() {
        this.states = new Map();
        this.TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
    }
    /**
     * Get or create conversation state for user
     */
    getState(userId, conversationId) {
        const key = `${userId}:${conversationId}`;
        let state = this.states.get(key);
        if (!state) {
            state = {
                userId,
                conversationId,
                currentFlow: null,
                step: 0,
                data: {},
                lastUpdated: new Date()
            };
            this.states.set(key, state);
        }
        // Check if state has timed out
        const now = new Date();
        if (now.getTime() - state.lastUpdated.getTime() > this.TIMEOUT_MS) {
            // Reset state if timed out
            state.currentFlow = null;
            state.step = 0;
            state.data = {};
        }
        state.lastUpdated = now;
        return state;
    }
    /**
     * Update conversation state
     */
    updateState(userId, conversationId, updates) {
        const key = `${userId}:${conversationId}`;
        const state = this.getState(userId, conversationId);
        Object.assign(state, updates, { lastUpdated: new Date() });
        this.states.set(key, state);
    }
    /**
     * Clear conversation state
     */
    clearState(userId, conversationId) {
        const key = `${userId}:${conversationId}`;
        this.states.delete(key);
    }
    /**
     * Set data field in current conversation
     */
    setData(userId, conversationId, field, value) {
        const state = this.getState(userId, conversationId);
        state.data[field] = value;
        state.lastUpdated = new Date();
        this.states.set(`${userId}:${conversationId}`, state);
    }
    /**
     * Get data field from current conversation
     */
    getData(userId, conversationId, field) {
        const state = this.getState(userId, conversationId);
        return state.data[field];
    }
    /**
     * Advance to next step
     */
    nextStep(userId, conversationId) {
        const state = this.getState(userId, conversationId);
        state.step += 1;
        state.lastUpdated = new Date();
        this.states.set(`${userId}:${conversationId}`, state);
    }
    /**
     * Clean up old states (run periodically)
     */
    cleanup() {
        const now = new Date();
        for (const [key, state] of this.states.entries()) {
            if (now.getTime() - state.lastUpdated.getTime() > this.TIMEOUT_MS) {
                this.states.delete(key);
            }
        }
    }
}
// Singleton instance
exports.conversationStateManager = new ConversationStateManager();
// Clean up every minute
setInterval(() => {
    exports.conversationStateManager.cleanup();
}, 60 * 1000);
exports.default = exports.conversationStateManager;
//# sourceMappingURL=ConversationStateManager.js.map