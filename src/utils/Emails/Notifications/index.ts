import addNotification from 'react-push-notification';
import {Notifications} from 'react-push-notification';

export function Notification(){
  function warningNotification() {
    addNotification({
      title: "Warning",
      subtitle: "",
      message:"",
      theme:"red",
      closeButton:"X"
    });
  }

  function successNotification() {
    addNotification({
        title: "Success",
        subtitle: "",
        message: "",
        theme: "light",
        closeButton: "X",
        backgroundTop: "green",
        backgroundBottom: "yellowgreen",
    });

    function NewFollowerNotification(userId: string) {
      addNotification({
          title: "NewFollower",
          subtitle: "You have a new follower",
          message: `${userId} has followed you`,
          theme: "light",
          closeButton: "X",
          backgroundTop: "green",
          backgroundBottom: "yellowgreen",
      });
  }

    if(!Notification){
      warningNotification();
    }
    else{
      successNotification();
    }
  }
}
  export default Notification;


/** //export const Notifications = async ({message: string, type: string }) => {
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
**/