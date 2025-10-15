/**
 * Conversation State Manager
 * Manages multi-step conversational flows for AI assistant
 */

interface ConversationState {
  userId: string;
  conversationId: string;
  currentFlow?: 'transfer' | 'bill_payment' | null;
  step: number;
  data: Record<string, any>;
  lastUpdated: Date;
}

class ConversationStateManager {
  private states: Map<string, ConversationState> = new Map();
  private readonly TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

  /**
   * Get or create conversation state for user
   */
  getState(userId: string, conversationId: string): ConversationState {
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
  updateState(userId: string, conversationId: string, updates: Partial<ConversationState>): void {
    const key = `${userId}:${conversationId}`;
    const state = this.getState(userId, conversationId);

    Object.assign(state, updates, { lastUpdated: new Date() });
    this.states.set(key, state);
  }

  /**
   * Clear conversation state
   */
  clearState(userId: string, conversationId: string): void {
    const key = `${userId}:${conversationId}`;
    this.states.delete(key);
  }

  /**
   * Set data field in current conversation
   */
  setData(userId: string, conversationId: string, field: string, value: any): void {
    const state = this.getState(userId, conversationId);
    state.data[field] = value;
    state.lastUpdated = new Date();
    this.states.set(`${userId}:${conversationId}`, state);
  }

  /**
   * Get data field from current conversation
   */
  getData(userId: string, conversationId: string, field: string): any {
    const state = this.getState(userId, conversationId);
    return state.data[field];
  }

  /**
   * Advance to next step
   */
  nextStep(userId: string, conversationId: string): void {
    const state = this.getState(userId, conversationId);
    state.step += 1;
    state.lastUpdated = new Date();
    this.states.set(`${userId}:${conversationId}`, state);
  }

  /**
   * Clean up old states (run periodically)
   */
  cleanup(): void {
    const now = new Date();
    for (const [key, state] of this.states.entries()) {
      if (now.getTime() - state.lastUpdated.getTime() > this.TIMEOUT_MS) {
        this.states.delete(key);
      }
    }
  }
}

// Singleton instance
export const conversationStateManager = new ConversationStateManager();

// Clean up every minute
setInterval(() => {
  conversationStateManager.cleanup();
}, 60 * 1000);

export default conversationStateManager;
