import nodemailer from "nodemailer";
import https from "https";
import querystring from "querystring";

/**
 * Send a WhatsApp message using Ultra Message API
 * @param phone Phone number to send the message to
 * @param message Message content
 * @returns Promise that resolves when the message is sent
 */
export async function sendWhatsAppMessage(
  phone: string,
  message: string
): Promise<void> {
  try {
    if (!phone) {
      console.log("No phone number provided, skipping WhatsApp message");
      return;
    }

    // Check if ULTRA_MESSAGE_API_TOKEN is configured
    const apiToken = process.env.ULTRA_MESSAGE_API_TOKEN;
    const instanceId = process.env.ULTRA_MESSAGE_INSTANCE_ID;
    const apiKey = process.env.ULTRA_MESSAGE_API_KEY;

    if (!apiToken && !apiKey) {
      console.log(
        "Ultra Message credentials not configured, skipping WhatsApp message"
      );
      return;
    }

    // Format the phone number (remove spaces, dashes, etc.)
    let formattedPhone = phone.replace(/\D/g, "");

    // Add country code if not present
    if (!formattedPhone.startsWith("+")) {
      // Assuming Indian numbers if no country code
      if (!formattedPhone.startsWith("91")) {
        formattedPhone = "91" + formattedPhone;
      }
    } else {
      // Remove the + if present
      formattedPhone = formattedPhone.substring(1);
    }

    // Send the WhatsApp message using Ultra Message API
    try {
      // Try using API token first (if available)
      console.log(
        `WhatsApp message API token:`,
        apiToken,
        `Instance ID:`,
        instanceId,
        `Formatted phone:`,
        formattedPhone,
        `Message:`,
        message
      );

      if (apiToken && instanceId) {
        await new Promise<void>((resolve, reject) => {
          const postData = querystring.stringify({
            token: apiToken,
            to: formattedPhone,
            body: message,
            priority: "10",
          });

          const options = {
            method: "POST",
            hostname: "api.ultramsg.com",
            path: `/${instanceId}/messages/chat`,
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              "Content-Length": Buffer.byteLength(postData),
            },
          };

          const req = https.request(options, (res) => {
            const chunks: Buffer[] = [];

            res.on("data", (chunk) => {
              chunks.push(chunk);
            });

            res.on("end", () => {
              const body = Buffer.concat(chunks).toString();
              console.log(
                `WhatsApp message sent to ${phone} using API token:`,
                body
              );
              resolve();
            });
          });

          req.on("error", (error) => {
            console.error("Error sending WhatsApp message:", error);
            reject(error);
          });

          req.write(postData);
          req.end();
        });
      }
      // Fall back to API key if token not available
      else if (apiKey) {
        await new Promise<void>((resolve, reject) => {
          const postData = querystring.stringify({
            token: apiKey,
            to: formattedPhone,
            body: message,
            priority: "10",
            referenceId: "",
          });

          const options = {
            method: "POST",
            hostname: "api.ultramsg.com",
            path: "/instance43416/messages/chat",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              "Content-Length": Buffer.byteLength(postData),
            },
          };

          const req = https.request(options, (res) => {
            const chunks: Buffer[] = [];

            res.on("data", (chunk) => {
              chunks.push(chunk);
            });

            res.on("end", () => {
              const body = Buffer.concat(chunks).toString();
              console.log(
                `WhatsApp message sent to ${phone} using API key:`,
                body
              );
              resolve();
            });
          });

          req.on("error", (error) => {
            console.error("Error sending WhatsApp message:", error);
            reject(error);
          });

          req.write(postData);
          req.end();
        });
      } else {
        console.log("No valid Ultra Message credentials available");
      }
    } catch (error) {
      console.error("Error sending WhatsApp message:", error);
    }
  } catch (error) {
    // Log the error but don't throw, as this is a notification method
    console.error("Error sending WhatsApp message:", error);
  }
}

/**
 * Send an email using nodemailer
 * @param to Email address to send to
 * @param subject Email subject
 * @param html Email content in HTML format
 * @returns Promise that resolves when the email is sent
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<void> {
  try {
    if (!to) {
      console.log("No email address provided, skipping email");
      return;
    }

    const smtpEmail = process.env.SMTP_EMAIL;
    const smtpPassword = process.env.SMTP_PASSWORD;
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;

    if (!smtpEmail || !smtpPassword || !smtpHost || !smtpPort) {
      console.log("SMTP credentials not configured, skipping email");
      return;
    }

    // Create a transporter using SMTP
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: parseInt(smtpPort),
      secure: parseInt(smtpPort) === 465, // true for 465, false for other ports
      auth: {
        user: smtpEmail,
        pass: smtpPassword,
      },
    });

    // Send the email
    await transporter.sendMail({
      from: `"eFileTax" <${smtpEmail}>`,
      to,
      subject,
      html,
    });

    console.log(`Email sent to ${to}`);
  } catch (error) {
    // Log the error but don't throw, as this is a notification method
    console.error("Error sending email:", error);
  }
}

/**
 * Send WhatsApp message with file attachment
 * @param phone Phone number to send the message to
 * @param message Message content
 * @param fileUrl URL of the file to send
 * @returns Promise that resolves when the message is sent
 */
export async function sendWhatsAppMessageWithFile(
  phone: string,
  message: string,
  fileUrl: string
): Promise<void> {
  try {
    if (!phone) {
      console.log("No phone number provided, skipping WhatsApp message");
      return;
    }

    // Check if ULTRA_MESSAGE_API_TOKEN is configured
    const apiToken = process.env.ULTRA_MESSAGE_API_TOKEN;
    const instanceId = process.env.ULTRA_MESSAGE_INSTANCE_ID;
    const apiKey = process.env.ULTRA_MESSAGE_API_KEY;

    if (!apiToken && !apiKey) {
      console.log(
        "Ultra Message credentials not configured, skipping WhatsApp message"
      );
      return;
    }

    // Format the phone number (remove spaces, dashes, etc.)
    let formattedPhone = phone.replace(/\D/g, "");

    // Add country code if not present
    if (!formattedPhone.startsWith("+")) {
      // Assuming Indian numbers if no country code
      if (!formattedPhone.startsWith("91")) {
        formattedPhone = "91" + formattedPhone;
      }
    } else {
      // Remove the + if present
      formattedPhone = formattedPhone.substring(1);
    }

    // Send the WhatsApp message with file using Ultra Message API
    try {
      // Try using API token first (if available)
      console.log(
        `WhatsApp message with file API token:`,
        apiToken,
        `Instance ID:`,
        instanceId,
        `Formatted phone:`,
        formattedPhone,
        `Message:`,
        message,
        `File URL:`,
        fileUrl
      );

      if (apiToken && instanceId) {
        // First send the text message
        await new Promise<void>((resolve, reject) => {
          const postData = querystring.stringify({
            token: apiToken,
            to: formattedPhone,
            body: message,
            priority: "10",
          });

          const options = {
            method: "POST",
            hostname: "api.ultramsg.com",
            path: `/${instanceId}/messages/chat`,
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              "Content-Length": Buffer.byteLength(postData),
            },
          };

          const req = https.request(options, (res) => {
            const chunks: Buffer[] = [];

            res.on("data", (chunk) => {
              chunks.push(chunk);
            });

            res.on("end", () => {
              const body = Buffer.concat(chunks).toString();
              console.log(
                `WhatsApp message sent to ${phone} using API token:`,
                body
              );
              resolve();
            });
          });

          req.on("error", (error) => {
            console.error("Error sending WhatsApp message:", error);
            reject(error);
          });

          req.write(postData);
          req.end();
        });

        // Then send the file
        await new Promise<void>((resolve, reject) => {
          const postData = querystring.stringify({
            token: apiToken,
            to: formattedPhone,
            filename: "tax_summary.pdf", // Default filename
            document: fileUrl,
            priority: "10",
          });

          const options = {
            method: "POST",
            hostname: "api.ultramsg.com",
            path: `/${instanceId}/messages/document`,
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              "Content-Length": Buffer.byteLength(postData),
            },
          };

          const req = https.request(options, (res) => {
            const chunks: Buffer[] = [];

            res.on("data", (chunk) => {
              chunks.push(chunk);
            });

            res.on("end", () => {
              const body = Buffer.concat(chunks).toString();
              console.log(
                `WhatsApp file sent to ${phone} using API token:`,
                body
              );
              resolve();
            });
          });

          req.on("error", (error) => {
            console.error("Error sending WhatsApp file:", error);
            reject(error);
          });

          req.write(postData);
          req.end();
        });
      }
      // Fall back to API key if token not available
      else if (apiKey) {
        // First send the text message
        await new Promise<void>((resolve, reject) => {
          const postData = querystring.stringify({
            token: apiKey,
            to: formattedPhone,
            body: message,
            priority: "10",
            referenceId: "",
          });

          const options = {
            method: "POST",
            hostname: "api.ultramsg.com",
            path: "/instance43416/messages/chat",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              "Content-Length": Buffer.byteLength(postData),
            },
          };

          const req = https.request(options, (res) => {
            const chunks: Buffer[] = [];

            res.on("data", (chunk) => {
              chunks.push(chunk);
            });

            res.on("end", () => {
              const body = Buffer.concat(chunks).toString();
              console.log(
                `WhatsApp message sent to ${phone} using API key:`,
                body
              );
              resolve();
            });
          });

          req.on("error", (error) => {
            console.error("Error sending WhatsApp message:", error);
            reject(error);
          });

          req.write(postData);
          req.end();
        });

        // Then send the file
        await new Promise<void>((resolve, reject) => {
          const postData = querystring.stringify({
            token: apiKey,
            to: formattedPhone,
            filename: "tax_summary.pdf", // Default filename
            document: fileUrl,
            priority: "10",
            referenceId: "",
          });

          const options = {
            method: "POST",
            hostname: "api.ultramsg.com",
            path: "/instance43416/messages/document",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              "Content-Length": Buffer.byteLength(postData),
            },
          };

          const req = https.request(options, (res) => {
            const chunks: Buffer[] = [];

            res.on("data", (chunk) => {
              chunks.push(chunk);
            });

            res.on("end", () => {
              const body = Buffer.concat(chunks).toString();
              console.log(
                `WhatsApp file sent to ${phone} using API key:`,
                body
              );
              resolve();
            });
          });

          req.on("error", (error) => {
            console.error("Error sending WhatsApp file:", error);
            reject(error);
          });

          req.write(postData);
          req.end();
        });
      } else {
        console.log("No valid Ultra Message credentials available");
      }
    } catch (error) {
      console.error("Error sending WhatsApp message with file:", error);
    }
  } catch (error) {
    // Log the error but don't throw, as this is a notification method
    console.error("Error sending WhatsApp message with file:", error);
  }
}

/**
 * Send notification to user about submission update
 * @param user User object with name, email, and phone
 * @param submissionId Submission ID
 * @param status New status of the submission
 * @param comments Admin comments
 * @param fileUrl Optional file URL for completed submissions
 */
export async function sendSubmissionUpdateNotification(
  user: { name: string; email: string; phone?: string },
  submissionId: string,
  status: string,
  comments?: string,
  fileUrl?: string
): Promise<void> {
  console.log("Sending submission update notification to user ABCD");
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const submissionUrl = `${baseUrl}/dashboard/user/submissions/${submissionId}`;

    console.log(
      `Sending submission update notification to ${user.email} for submission ${submissionId} with status ${status}`
    );
    // For "Need more info" status (sent for revision)
    if (status === "sent for revision" && comments) {
      // Prepare the email content
      const emailSubject =
        "Action Required: Additional Information Needed for Your Submission";
      const emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a56db;">Additional Information Needed</h2>
          <p>Hello ${user.name},</p>
          <p>Our team has reviewed your submission and we need some additional information to proceed further.</p>
          
          <div style="background-color: #f3f4f6; padding: 15px; border-left: 4px solid #1a56db; margin: 20px 0;">
            <p style="margin: 0;"><strong>Admin Comments:</strong></p>
            <p style="margin-top: 10px; white-space: pre-wrap;">${comments}</p>
          </div>
          
          <p>Please log in to your account and provide the requested information at your earliest convenience.</p>
          
          <div style="margin: 25px 0;">
            <a href="${submissionUrl}" style="background-color: #1a56db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">View Your Submission</a>
          </div>
          
          <p>If you have any questions, please don't hesitate to contact us.</p>
          <p>Thank you,<br>The eFileTax Team</p>
        </div>
      `;

      // Send email notification
      await sendEmail(user.email, emailSubject, emailContent);

      // Prepare WhatsApp message if phone number is available
      if (user.phone) {
        const whatsappMessage =
          `Hello ${user.name},\n\n` +
          `Our team has reviewed your submission and we need some additional information to proceed further.\n\n` +
          `Admin Comments:\n${comments}\n\n` +
          `Please log in to your account and provide the requested information at your earliest convenience.\n\n` +
          `You can access your submission here: ${submissionUrl}\n\n` +
          `Thank you,\nThe eFileTax Team`;

        // Send WhatsApp notification
        await sendWhatsAppMessage(user.phone, whatsappMessage);
      }
    }
    // For "Completed" status (approved) with file
    else if (status === "approved" && fileUrl) {
      // Prepare the email content
      const emailSubject = "Good News: Your Submission Has Been Completed";
      const emailContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1a56db;">Submission Completed</h2>
          <p>Hello ${user.name},</p>
          <p>Great news! Our team has completed processing your submission.</p>
          
          <p>We have attached your tax summary document to this email. You can also view your submission details by clicking the button below.</p>
          
          <div style="margin: 25px 0;">
            <a href="${submissionUrl}" style="background-color: #1a56db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">View Your Submission</a>
          </div>
          
          <p>If you have any questions, please don't hesitate to contact us.</p>
          <p>Thank you for choosing our services.</p>
          <p>Best regards,<br>The eFileTax Team</p>
        </div>
      `;

      // Send email notification
      await sendEmail(user.email, emailSubject, emailContent);

      // Prepare WhatsApp message if phone number is available
      if (user.phone) {
        const whatsappMessage =
          `Hello ${user.name},\n\n` +
          `Great news! Our team has completed processing your submission.\n\n` +
          `We have attached your tax summary document to this message. You can also view your submission details by visiting the link below.\n\n` +
          `${submissionUrl}\n\n` +
          `Thank you for choosing our services.\n\n` +
          `Best regards,\nThe eFileTax Team`;

        // Send WhatsApp notification with file
        await sendWhatsAppMessageWithFile(user.phone, whatsappMessage, fileUrl);
      }
    }
    // For other statuses, don't send notifications
  } catch (error) {
    console.error("Error sending submission update notification:", error);
  }
}

/**
 * Send notification to admin about user reply
 * @param admin Admin object with name, email, and phone
 * @param user User object with name and email
 * @param submissionId Submission ID
 * @param userComments User comments
 */
export async function sendUserReplyNotification(
  admin: { name: string; email: string; phone?: string },
  user: { name: string; email: string },
  submissionId: string,
  userComments: string
): Promise<void> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const submissionUrl = `${baseUrl}/dashboard/admin/submissions/${submissionId}`;

    console.log(
      `Sending user reply notification to admin ${admin.email} for submission ${submissionId}`
    );

    // Prepare the email content
    const emailSubject = "New User Reply: Action Required";
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a56db;">New User Reply</h2>
        <p>Hello ${admin.name},</p>
        <p>User ${user.name} (${user.email}) has replied to your request for additional information.</p>
        
        <div style="background-color: #f3f4f6; padding: 15px; border-left: 4px solid #1a56db; margin: 20px 0;">
          <p style="margin: 0;"><strong>User Comments:</strong></p>
          <p style="margin-top: 10px; white-space: pre-wrap;">${userComments}</p>
        </div>
        
        <p>Please review their response and take appropriate action.</p>
        
        <div style="margin: 25px 0;">
          <a href="${submissionUrl}" style="background-color: #1a56db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">View Submission</a>
        </div>
        
        <p>Thank you,<br>The eFileTax Team</p>
      </div>
    `;

    // Send email notification
    await sendEmail(admin.email, emailSubject, emailContent);

    // Prepare WhatsApp message if phone number is available
    if (admin.phone) {
      const whatsappMessage =
        `Hello ${admin.name},\n\n` +
        `User ${user.name} (${user.email}) has replied to your request for additional information.\n\n` +
        `User Comments:\n${userComments}\n\n` +
        `Please review their response and take appropriate action.\n\n` +
        `You can access the submission here: ${submissionUrl}\n\n` +
        `Thank you,\nThe eFileTax Team`;

      // Send WhatsApp notification
      await sendWhatsAppMessage(admin.phone, whatsappMessage);
    }
  } catch (error) {
    console.error("Error sending user reply notification:", error);
  }
}
