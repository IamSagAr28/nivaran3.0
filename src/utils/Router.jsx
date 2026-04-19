import React, { useState, useEffect } from 'react';

// Custom event for navigation
const PUSH_STATE_EVENT = 'pushstate';

// Simple Router Hook
export const useRouter = () => {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener(PUSH_STATE_EVENT, handleLocationChange);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener(PUSH_STATE_EVENT, handleLocationChange);
    };
  }, []);

  const navigateTo = (path) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new Event(PUSH_STATE_EVENT));
  };

  return {
    currentPath,
    navigateTo
  };
};

// Simple Router Component
export const Router = ({ children, fallback = null }) => {
  const { currentPath } = useRouter();

  const childArray = React.Children.toArray(children);

  let params = {};

  const matchedChild = childArray.find(child => {
    if (!React.isValidElement(child)) return false;

    const { path } = child.props;
    if (typeof path !== 'string') return false;

    // Normalize paths by removing trailing slashes and lowercase for better matching
    const p = path.trim();
    const normalizedPath = (p === '/' ? p : p.replace(/\/$/, '')).toLowerCase();
    
    const cp = (currentPath || '').trim();
    const normalizedCurrentPath = (cp === '/' ? cp : cp.replace(/\/$/, '')).toLowerCase();

    // Direct match
    if (normalizedPath === normalizedCurrentPath) return true;

    // Parameter match (e.g. /blogs/:handle)
    if (path.includes(':')) {
      const keys = [];
      const regexStr = path.replace(/:([^\/]+)/g, (_, key) => {
        keys.push(key);
        return '([^/]+)';
      });
      // Anchored strictly
      const regex = new RegExp(`^${regexStr}$`);
      const match = currentPath.match(regex);

      if (match) {
        keys.forEach((key, index) => {
          params[key] = match[index + 1];
        });
        return true;
      }
    }

    return false;
  });

  if (matchedChild) {
    const { component: Component } = matchedChild.props;
    return <Component params={params} />;
  }

  // Return fallback component for 404 pages
  return fallback;
};

// Route Component
export const Route = ({ path, component: Component }) => {
  return <Component />;
};