import * as Linking from 'expo-linking';

export const linking = {
  prefixes: [Linking.createURL('/'), 'friendmatch://'],
  config: {
    screens: {
      SignIn: 'sign-in',
      SignUp: 'sign-up',
      ForgotPassword: 'forgot-password',
      NewPassword: {
        path: 'reset-password',
        parse: {
          token: (value) => value,
          code: (value) => value
        }
      },
      Home: {
        screens: {
          Explore: 'explorar',
          Chats: 'chats',
          Profile: 'perfil'
        }
      },
      ChatDetail: {
        path: 'chat/:conversationId',
        parse: {
          conversationId: (value) => value
        }
      }
    }
  }
};
