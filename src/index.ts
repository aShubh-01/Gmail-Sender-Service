import express, { Request, Response } from 'express';
import cors from 'cors';
import zod from 'zod';
import nodemailer from 'nodemailer';

const port : number | string = process.env.PORT || 3000;

const gmailSenderApp = express();

gmailSenderApp.use(cors());
gmailSenderApp.use(express.json());

const sendEmailBodySchema = zod.object({                            // DEFINE THE EMAIL SCHEMA TO MATCH THE RECEIVED JSON.
    senderGmailAddress: zod.string().includes('@gmail.com', { message: "Sender's Gmail must include valid tokens/domains like '@', 'gmail.com'"}).min(11, { message: "Sender's Gmail address cannot be empty, eg. 'sender123@gmail.com'"} ),
    senderGmailAppPassword: zod.string().min(16, { message: "Sender's Gmail App Password is 4x4 long string, eg. 'abcd efgh ijkl mnop'"} ),
    receiverGmailAddress: zod.string().includes('@gmail.com', { message: "Receiver's Gmail must include valid tokens/domains like '@', 'gmail.com'"}).min(11, { message: "Receiver's Gmail address cannot be empty, eg. 'receiver123@gmail.com'" } ),
    gmailSubject: zod.string().optional(),
    gmailBody: zod.string().min(1, { message: 'Email Body cannot be empty'} ),
})

gmailSenderApp.head('/');
gmailSenderApp.get('/', (req, res) => {res.send("Gmail Sender API Service Working")});

gmailSenderApp.post('/sendGmail', async (req, res) : Promise<Response | any> => {
    const { senderGmailAddress, senderGmailAppPassword, receiverGmailAddress, gmailSubject, gmailBody } = req.body;

    try {
        const parseResponse = sendEmailBodySchema.safeParse(req.body);
        if(!parseResponse.success) {
            return res.status(401).json({
                message: 'Invalid Gmail Data Credentials/Format',
                issues: parseResponse.error.issues.map((issue) => issue.message)
            })
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            secure: true,
            auth: {
                user: senderGmailAddress,
                pass: senderGmailAppPassword
            }
        })

        const mailOptions = {
            from: senderGmailAddress,
            to: receiverGmailAddress,
            subject: gmailSubject,
            html: gmailBody
        }

        try {
            await transporter.sendMail(mailOptions);
        } catch (err) {
            return res.status(500).json({
                message: 'Unable to send gmail'
            })
        }

        return res.status(200).json({
            message: 'Gmail sent successfully'
        })

    } catch (err) {
        console.error(err)

        return res.status(500).json({
            message: 'Unable to send gmail'
        })
    }
})

gmailSenderApp.listen(port, () => console.log(`Gmail Sender Service Running on port ${port}`))