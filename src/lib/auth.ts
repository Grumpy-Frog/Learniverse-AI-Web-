/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { api, setAccessToken, clearAuth } from './api';
import { User } from '../types';

export async function getCurrentUser(): Promise<User | null> {
  const token = sessionStorage.getItem('learniverse_access_token');
  if (!token) {
    return null;
  }
  try {
    const user = await api.getMe();
    sessionStorage.setItem('learniverse_user_profile', JSON.stringify(user));
    return user;
  } catch (error) {
    console.error('Failed to load user profile, clearing session:', error);
    logoutUser();
    return null;
  }
}

export function saveSession(token: string, profile?: any) {
  sessionStorage.setItem('learniverse_access_token', token);
  setAccessToken(token);
  if (profile) {
    sessionStorage.setItem('learniverse_user_profile', JSON.stringify(profile));
  }
}

export function logoutUser() {
  clearAuth();
  sessionStorage.removeItem('learniverse_selected_topic');
  sessionStorage.removeItem('learniverse_user_profile');
}

export function purgeSession() {
  logoutUser();
}

export function getProfile(): any {
  const profile = sessionStorage.getItem('learniverse_user_profile');
  if (!profile) return { role: 'guest' };
  try {
    return JSON.parse(profile);
  } catch (e) {
    return { role: 'guest' };
  }
}

export function isAuthenticated(): boolean {
  return !!sessionStorage.getItem('learniverse_access_token');
}

export function getSelectedTopic(): any {
  const data = sessionStorage.getItem('learniverse_selected_topic');
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch (e) {
    return null;
  }
}

export function setSelectedTopic(topicContext: any | null) {
  if (topicContext) {
    sessionStorage.setItem('learniverse_selected_topic', JSON.stringify(topicContext));
  } else {
    sessionStorage.removeItem('learniverse_selected_topic');
  }
}

