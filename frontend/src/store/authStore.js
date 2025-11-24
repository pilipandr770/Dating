import create from 'zustand'

export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  login: (email, password) => {},
  logout: () => set({ user: null, token: null })
}))
