import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@homework-tracker.com";

export async function sendNewQuestionEmail(studentEmails: string[], questionTitle: string, chapter: number) {
  try {
    await Promise.all(
      studentEmails.map(email =>
        resend.emails.send({
          from: FROM_EMAIL,
          to: email,
          subject: `New Homework: Chapter ${chapter} - ${questionTitle}`,
          html: `<p>A new homework question has been posted:</p><p><strong>${questionTitle}</strong> (Chapter ${chapter})</p><p>Please log in to submit your answer.</p>`,
        })
      )
    );
  } catch (e) {
    console.error("Failed to send email", e);
  }
}

export async function sendSubmissionEmail(taEmail: string, studentEmail: string, questionTitle: string) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: taEmail,
      subject: `Student Submission: ${questionTitle}`,
      html: `<p>${studentEmail} submitted an answer to <strong>${questionTitle}</strong></p><p>Please review and grade.</p>`,
    });
  } catch (e) {
    console.error("Failed to send email", e);
  }
}

export async function sendGradeEmail(studentEmail: string, questionTitle: string, score: number, maxScore: number, note?: string) {
  try {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: studentEmail,
      subject: `Grade: ${questionTitle}`,
      html: `<p>Your submission for <strong>${questionTitle}</strong> has been graded.</p><p><strong>Score:</strong> ${score} / ${maxScore}</p>${note ? `<p><strong>Feedback:</strong> ${note}</p>` : ""}`,
    });
  } catch (e) {
    console.error("Failed to send email", e);
  }
}
