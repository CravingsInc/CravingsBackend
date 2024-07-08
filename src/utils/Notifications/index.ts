


//export const Notifications = async ({message: string, type: string }) => {
   // return (
       
            Notification.requestPermission().then(perm => {
            if (perm === "granted"){
               // const notification = new Notifications;
              // Message: ""
              //  type: ""
              class Notification {
                static async create(notification: Notification): Promise<Notification> {
                    console.log('Notification created:', notification);
                    return notification;
                }
              }
            }
      }));

    
//};

export  {Notifications, Notification};
