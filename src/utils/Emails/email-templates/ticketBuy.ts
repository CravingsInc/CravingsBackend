export const ticketBuy = `
<!DOCTYPE html>
<html>

<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Expletus+Sans:ital,wght@0,400..700;1,400..700&display=swap');
    .container {
      width: 45vw;
      margin-right: auto;
      margin-left: auto;
      border-radius: 1vw;
      height: fit-content;
      padding: 1vw;
      margin-top: auto;
      margin-bottom: auto;
    }

    .container .header img {
      width: 100%;
      height: 20vw;
      border-radius: 1vw;
    }

    .container .header .logo {
      background-image: linear-gradient(to bottom right, #FFFFFF, #393838);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
      font-size: 7vw;
      font-family: "Expletus Sans";
      position: fixed;
      top: 3vw;
      left: 36vw;
    }

    .container .content {
      width: 90%;
      margin-left: auto;
      margin-right: auto;
      font-family: "Expletus Sans";
    }

    .container .content .title {
      font-size: 2vw;
    }

    .container .content .desc {
      font-size: 1vw;
      width: 80%;
      margin-right: auto;
      margin-left: auto;
      padding: 1vw;
      text-align: center;
    }

    .container .content .qrCode {
      display: flex;
      justify-content: center;
    }

    .container .content .qrCode img {
      width: 15vw;
      height: 15vw;
    }

    @media only screen and (max-width: 600px) {
      .container {
        width: 80vw;
        margin-top: 10vw;
      }

      .container .header img {
        height: 45vw;
        border-radius: 2vw;
      }

      .container .header .logo {
        font-size: 15vw;
        left: 22vw;
        top: 17vw;
      }

      .container .content .title {
        font-size: 5vw;
      }

      .container .content .desc {
        font-size: 2.5vw;
      }
    }
  </style>
</head>

<body>
  <div class='container'>
    <div class='header'>
      <img src='{{banner}}' alt='event-banner' />
      <div class='logo'>Cravings</div>
    </div>

    <div class='content'>
      <div class='title'>Hi {{name}},</div>
      <div class='desc'>This is your ticket confirmation. Thank you for buying tickets to {{eventName}}!!! We are excited to see you!</div>
      <div class='qrCode'>
        <a href='{{ticketLink}}'>
          <img src='{{qrCode}}' alt='qrCode' class='qrCode' />
        </a>
      </div>
    </div>
  </div>
</body>

</html>
`

export type TicketBuyProps = {
    name: string;
    eventName: string;
    banner: string;
    ticketLink: string;
    qrCode: string;
    email: string;
}
