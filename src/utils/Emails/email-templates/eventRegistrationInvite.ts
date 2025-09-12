export const eventRegistrationInvite = `
<!DOCTYPE html>
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

    .cec .form .link-div {
      width: fit-content;
      margin-left: auto;
      margin-right: auto;
      margin-top: 20px;
      margin-bottom: 20px;
    }

    .cec .form .link {
      background-color: #1aaff9;
      border: 1px solid #1aaff9;
      color: white;
      border-radius: 10px;
      padding: 10px;
      text-decoration: none;
    }
  </style>
</head>

<body>
  <div class="cec">
    <h1>{{name}} - You're Invited To {{eventName}}</h1>

    <div class='form'>
      <div class='notify'>
        {{message}}
      </div>

      <div class='link-div'>
        <a href="{{link_to_open}}" class="link" target="_blank" >Click Me To Accept</a>
      </div>
    </div>
  </div>
</body>

</html>
`;

export type EventRegistrationInviteProps = {
    link_to_open: string;
    name: string;
    orgName: string;
    eventName: string;
    email: string;
    customMessage?: string;
    message?: string;
}
