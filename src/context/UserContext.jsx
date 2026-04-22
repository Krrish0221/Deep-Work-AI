import React, { createContext, useContext, useState, useEffect } from 'react';

const UserContext = createContext();

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  const [userData, setUserData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate Firebase onAuthStateChanged
    const storedUser = localStorage.getItem('dwg_user');
    if (storedUser) {
      setUserData(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const signup = async (fullName, email, password) => {
    // Simulate network request
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const newUser = {
      uid: 'user_' + Date.now(),
      displayName: fullName,
      email: email,
      avatarColor: "#7c3aed",
      avatarInitial: fullName[0].toUpperCase(),
      avatarType: 'initials',
      avatarSource: null,
      plan: "Premium", // Simulated premium
      createdAt: new Date().toISOString()
    };
    
    setUserData(newUser);
    localStorage.setItem('dwg_user', JSON.stringify(newUser));
    return newUser;
  };

  const login = async (email, password) => {
    // Simulate network request
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // In a real app, verify credentials. Here we just mock success.
    const existingUser = localStorage.getItem('dwg_user');
    if (existingUser) {
      const user = JSON.parse(existingUser);
      if (user.email === email) {
        setUserData(user);
        return user;
      }
    }
    
    // Fallback if no user in local storage
    const fallbackUser = {
      uid: 'user_fallback',
      displayName: email.split('@')[0],
      email: email,
      avatarColor: "#7c3aed",
      avatarInitial: email[0].toUpperCase(),
      avatarType: 'initials',
      avatarSource: null,
      plan: "Premium",
      createdAt: new Date().toISOString()
    };
    setUserData(fallbackUser);
    localStorage.setItem('dwg_user', JSON.stringify(fallbackUser));
    return fallbackUser;
  };

  const logout = async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    setUserData(null);
    localStorage.removeItem('dwg_user');
  };

  const resetPassword = async (email) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Simulate sending email
    return true;
  };

  const updateProfile = async (updates) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    setUserData(prev => {
      const updated = { ...prev, ...updates };
      localStorage.setItem('dwg_user', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <UserContext.Provider value={{ 
      userData, 
      setUserData, 
      isLoading, 
      login, 
      signup, 
      logout, 
      resetPassword,
      updateProfile 
    }}>
      {children}
    </UserContext.Provider>
  );
};
