import type { User } from '@libs/types';

export const useMockedUser = (): User => {
  // To get the user from the authContext, you can use
  // `const { user } = useAuth();`
  return {
    id: '5e86809283e28b96d2d38537',
    avatar: '/assets/avatars/avatar-marcus-finn.png',
    name: 'Divesh Heeramun',
    email: 'divesh@inncarsholiday.com'
  };
};
