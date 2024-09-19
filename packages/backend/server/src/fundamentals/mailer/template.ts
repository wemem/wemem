export const emailTemplate = ({
  title,
  content,
  buttonContent,
  buttonUrl,
  subContent,
}: {
  title: string;
  content: string;
  buttonContent?: string;
  buttonUrl?: string;
  subContent?: string;
}) => {
  return `<body style="background: #f6f7fb; overflow: hidden">
      <table
        width="100%"
        border="0"
        cellpadding="24px"
        style="
          background: #fff;
          max-width: 450px;
          margin: 32px auto 0 auto;
          border-radius: 16px 16px 0 0;
          box-shadow: 0px 0px 20px 0px rgba(66, 65, 73, 0.04);
        "
      >
        <tr>
          <td>
            <a href="https://affine.pro" target="_blank">
              <img
                src="https://cdn.affine.pro/mail/wemem-logo-with-text.png"
                alt="AFFiNE log"
                height="32px"
              />
            </a>
          </td>
        </tr>
        <tr>
          <td
            style="
              font-size: 20px;
              font-weight: 600;
              line-height: 28px;
              font-family: inter, Arial, Helvetica, sans-serif;
              color: #444;
              padding-top: 0;
            "
          >${title}</td>
        </tr>
        <tr>
          <td
            style="
              font-size: 15px;
              font-weight: 400;
              line-height: 24px;
              font-family: inter, Arial, Helvetica, sans-serif;
              color: #444;
              padding-top: 0;
            "
          >${content}</td>
        </tr>
        ${
          buttonContent && buttonUrl
            ? `<tr>
          <td style="margin-left: 24px; padding-top: 0; padding-bottom: ${
            subContent ? '0' : '64px'
          }">
            <table border="0" cellspacing="0" cellpadding="0">
              <tr>
                <td style="border-radius: 8px" bgcolor="#3E6FDB">
                  <a
                    href="${buttonUrl}"
                    target="_blank"
                    style="
                      font-size: 15px;
                      font-family: inter, Arial, Helvetica, sans-serif;
                      font-weight: 600;
                      line-height: 24px;
                      color: #fff;
                      text-decoration: none;
                      border-radius: 8px;
                      padding: 8px 18px;
                      border: 1px solid rgba(62,111,219,0.1);
                      display: inline-block;
                      font-weight: bold;
                    "
                    >${buttonContent}</a
                  >
                </td>
              </tr>
            </table>
          </td>
        </tr>`
            : ''
        }
         ${
           subContent
             ? `<tr>
                <td
                  style="
                    font-size: 12px;
                    font-weight: 400;
                    line-height: 20px;
                    font-family: inter, Arial, Helvetica, sans-serif;
                    color: #444;
                    padding-top: 24px;
                  "
                >
                 ${subContent}
                </td>
              </tr>`
             : ''
         }
      </table>
      <table
        width="100%"
        border="0"
        style="
          background: #fafafa;
          max-width: 450px;
          margin: 0 auto 32px auto;
          border-radius: 0 0 16px 16px;
          box-shadow: 0px 0px 20px 0px rgba(66, 65, 73, 0.04);
          padding: 20px;
        "
      >
        <tr align="center">
          <td>
            <table cellpadding="0">
              <tr>
                <td style="padding: 0 10px">
                  <a
                    href="https://github.com/wemem/wemem"
                    target="_blank"
                    ><img
                      src="https://cdn.affine.pro/mail/Github.png"
                      alt="AFFiNE github link"
                      height="16px"
                  /></a>
                </td>
                <td style="padding: 0 10px">
                  <a href="https://twitter.com/wememai" target="_blank">
                    <img
                      src="https://cdn.affine.pro/mail/Twitter.png"
                      alt="AFFiNE twitter link"
                      height="16px"
                    />
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr align="center">
          <td
            style="
              font-size: 12px;
              font-weight: 400;
              line-height: 20px;
              font-family: inter, Arial, Helvetica, sans-serif;
              color: #8e8d91;
              padding-top: 8px;
            "
          >
            One hyper-fused platform for wildly creative minds
          </td>
        </tr>
        <tr align="center">
          <td
            style="
              font-size: 12px;
              font-weight: 400;
              line-height: 20px;
              font-family: inter, Arial, Helvetica, sans-serif;
              color: #8e8d91;
              padding-top: 8px;
            "
          >
            Copyright<img
              src="https://cdn.affine.pro/mail/copyright.png"
              alt="copyright"
              height="14px"
              style="vertical-align: middle; margin: 0 4px"
            />2023-${new Date().getUTCFullYear()} Toeverything
          </td>
        </tr>
      </table>
    </body>`;
};

// 移除的社交链接
// <td style="padding: 0 10px">
//                   <a href="https://discord.gg/Arn7TqJBvG" target="_blank"
//                     ><img
//                       src="https://cdn.affine.pro/mail/Discord.png"
//                       alt="AFFiNE discord link"
//                       height="16px"
//                   /></a>
//                 </td>
//                 <td style="padding: 0 10px">
//                   <a href="https://www.youtube.com/@wememai" target="_blank"
//                     ><img
//                       src="https://cdn.affine.pro/mail/Youtube.png"
//                       alt="AFFiNE youtube link"
//                       height="16px"
//                   /></a>
//                 </td>
//                 <td style="padding: 0 10px">
//                   <a href="https://t.me/affineworkos" target="_blank"
//                     ><img
//                       src="https://cdn.affine.pro/mail/Telegram.png"
//                       alt="AFFiNE telegram link"
//                       height="16px"
//                   /></a>
//                 </td>
//                 <td style="padding: 0 10px">
//                   <a href="https://www.reddit.com/r/Affine/" target="_blank"
//                     ><img
//                       src="https://cdn.affine.pro/mail/Reddit.png"
//                       alt="AFFiNE reddit link"
//                       height="16px"
//                   /></a>
//                 </td>
