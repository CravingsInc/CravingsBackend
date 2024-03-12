export const contact = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta http-equiv="x-ua-compatible" content="ie=edge">
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
  
      .cec .form .link {
        display: flex;
        flex-direction: row;
        padding: 20px;
        width: 65vw;
        margin-right: auto;
        margin-left: auto;
        column-gap: 60vw;
      }
  
      .cec .form .label p {
        border-bottom: 1px solid black;
      }

      @media only screen and (max-width: 600px) {
        .cec .form .link {
          column-gap: 30vw;
        }
      }
    </style>
  </head>
  <body>
    <div class="cec">
      <h1>Contact Request</h1>
      <div class="form">
        <div class='link'>
          <div class="label">
            <label>First Name </label>
            <p>{{first_name}}</p>
          </div>

          <div class="label">
            <label>Last Name </label>
            <p>{{last_name}}</p>
          </div>
        </div>

        <div class="label">
          <label>Email </label>
          <p>{{email}}</p>
        </div>

        <div class="label">
          <label>Phone Number </label>
          <p>{{phone_number}}</p>
        </div>

        <div class="label">
          <label>Message </label>
          <p>{{message}}</p>
        </div>
      </div>
    </div>
  </body>
</html>
`;

export type ContactProps = {
  first_name: string;
  last_name: string;
  message: string;
  email: string;
  phone_number: string;
}
