import { userInfo } from "os";
import { UserFollowers } from "../../../models";

export const newFollower = `<!DOCTYPE html>
<html>

<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">

  <style>
    .cec {
      background-color: white;
      border: 1px solid gainsboro;
      border-radius: 10px;
      padding: 8px;
      width: 69vw;
      margin-right: auto;
      margin-left: auto;
    }
  
    .cec h1 {
      text-align: center;
      border-bottom: 1px solid gainsboro;
    }
  
    .cec .form .notify {
      text-align: center;
    }

    

    
  </style>
</head>

<body>
  <div class="cec">
    <h1>New Follower</h1>

    <div class='form'>
      <div class='notify'>
        You have recived a new follower. wants to follow you
      </div>
    </div>
  </div>
</body>

</html>`;

export type NewFollowerNotificationProps = {
    userprofile: string;
    email: string;
    username: string;
}