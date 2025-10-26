import * as React from "react";

interface CaseStudyReadyEmailProps {
  userName: string;
  caseStudyTitle: string;
  projectId: string;
  caseStudyId: string;
}

export function CaseStudyReadyEmail({
  userName,
  caseStudyTitle,
  projectId,
  caseStudyId,
}: CaseStudyReadyEmailProps) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const caseStudyUrl = `${baseUrl}/dashboard/projects/${projectId}/case-study`;

  return (
    <html>
      <head>
        <style>{`
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f3f4f6;
          }
          .container {
            max-width: 600px;
            margin: 40px auto;
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
          }
          .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 700;
          }
          .content {
            padding: 40px 30px;
          }
          .greeting {
            font-size: 18px;
            margin-bottom: 20px;
          }
          .case-study-box {
            background: #f9fafb;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #3b82f6;
            margin: 20px 0;
          }
          .case-study-title {
            font-size: 20px;
            font-weight: 600;
            color: #111827;
            margin: 0;
          }
          .features-list {
            background: #f9fafb;
            padding: 20px 20px 20px 40px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .features-list li {
            margin: 12px 0;
            color: #374151;
          }
          .button {
            display: inline-block;
            background: #3b82f6;
            color: white !important;
            padding: 16px 32px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            margin: 20px 0;
            text-align: center;
          }
          .button-container {
            text-align: center;
            margin: 30px 0;
          }
          .footer {
            text-align: center;
            color: #6b7280;
            font-size: 14px;
            padding: 30px;
            background: #f9fafb;
          }
          .footer-link {
            color: #3b82f6;
            text-decoration: none;
          }
          .tip {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 16px;
            border-radius: 8px;
            margin: 20px 0;
            font-size: 14px;
            color: #78350f;
          }
        `}</style>
      </head>
      <body>
        <div className="container">
          <div className="header">
            <h1>🎉 Your case study is ready!</h1>
          </div>

          <div className="content">
            <p className="greeting">Hi {userName},</p>

            <p>
              Great news! We've finished analyzing your customer interview and
              generated a professional case study.
            </p>

            <div className="case-study-box">
              <p className="case-study-title">{caseStudyTitle}</p>
            </div>

            <p>Your case study includes:</p>

            <ul className="features-list">
              <li>
                ✨ AI-generated narrative with problem, solution, and results
              </li>
              <li>💬 Key quotes from your customer interview</li>
              <li>📊 Highlighted metrics and achievements</li>
              <li>📱 Ready-to-use LinkedIn and X/Twitter posts</li>
              <li>🎯 SEO-optimized title and description</li>
            </ul>

            <div className="button-container">
              <a href={caseStudyUrl} className="button">
                View Your Case Study →
              </a>
            </div>

            <div className="tip">
              <strong>💡 Pro tip:</strong> Review and customize the content to
              match your brand voice, then publish it to your website or share
              it on social media to attract more clients!
            </div>

            <p
              style={{ color: "#6b7280", fontSize: "14px", marginTop: "30px" }}
            >
              You can now review, edit, and publish your case study. Share it on
              your website, social media, or in proposals to build trust and win
              more business.
            </p>
          </div>

          <div className="footer">
            <p>
              <strong>Casevia</strong> • Turn customer interviews into case
              studies in minutes
            </p>
            <p>
              <a href={`${baseUrl}/dashboard/projects`} className="footer-link">
                View all your projects
              </a>{" "}
              •{" "}
              <a href={`${baseUrl}/dashboard/settings`} className="footer-link">
                Settings
              </a>
            </p>
            <p
              style={{ fontSize: "12px", marginTop: "20px", color: "#9ca3af" }}
            >
              You're receiving this because you uploaded a project to Casevia.
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}

export default CaseStudyReadyEmail;
