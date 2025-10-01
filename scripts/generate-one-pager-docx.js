/**
 * Generate OrokiiPay One-Pager DOCX Document
 * Creates a professional Word document for potential customers
 */

const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle } = require('docx');
const fs = require('fs');
const path = require('path');

// Create the document
const doc = new Document({
  sections: [{
    properties: {},
    children: [
      // Title
      new Paragraph({
        text: "OrokiiPay",
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 }
      }),

      new Paragraph({
        text: "AI-Enhanced Multi-Tenant Banking Platform",
        heading: HeadingLevel.HEADING_2,
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 }
      }),

      // Tagline
      new Paragraph({
        children: [
          new TextRun({
            text: "Transform Your Financial Institution with Next-Generation Banking Technology",
            bold: true,
            size: 24
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 }
      }),

      new Paragraph({
        text: "OrokiiPay is a comprehensive, AI-powered banking platform designed specifically for financial institutions seeking to deliver exceptional digital banking experiences. Built on enterprise-grade infrastructure, OrokiiPay enables banks and microfinance institutions to offer modern, secure, and intelligent banking services to their customers.",
        spacing: { after: 400 }
      }),

      // Section: What Makes OrokiiPay Different
      new Paragraph({
        text: "What Makes OrokiiPay Different",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 200 }
      }),

      new Paragraph({
        children: [
          new TextRun({ text: "AI-First Banking Experience", bold: true })
        ],
        spacing: { after: 100 }
      }),

      new Paragraph({
        text: "• Conversational AI Assistant: Natural language banking - customers can ask \"How much did I spend on groceries last month?\" and get instant, intelligent responses",
        spacing: { after: 100 }
      }),

      new Paragraph({
        text: "• Voice-Enabled Banking: Push-to-talk and continuous voice modes for hands-free transactions",
        spacing: { after: 100 }
      }),

      new Paragraph({
        text: "• Smart Financial Insights: Real-time spending analysis, savings recommendations, and personalized financial advice",
        spacing: { after: 100 }
      }),

      new Paragraph({
        text: "• Fraud Detection: Sub-5ms fraud detection (100x faster than industry standard)",
        spacing: { after: 200 }
      }),

      new Paragraph({
        children: [
          new TextRun({ text: "Global-Ready Platform", bold: true })
        ],
        spacing: { after: 100 }
      }),

      new Paragraph({
        text: "• Multi-Language Support: English, French, German, Spanish with professional banking terminology",
        spacing: { after: 100 }
      }),

      new Paragraph({
        text: "• Multi-Currency: Support for NGN, USD, CAD, GBP, EUR, ZAR with locale-specific formatting",
        spacing: { after: 100 }
      }),

      new Paragraph({
        text: "• International Phone Validation: Support for 9 countries including Nigeria, USA, UK, and European markets",
        spacing: { after: 100 }
      }),

      new Paragraph({
        text: "• Cross-Platform: Seamless experience across web, mobile (iOS/Android), and voice interfaces",
        spacing: { after: 200 }
      }),

      new Paragraph({
        children: [
          new TextRun({ text: "Enterprise-Grade Security", bold: true })
        ],
        spacing: { after: 100 }
      }),

      new Paragraph({
        text: "• CBN Compliant: Full adherence to Central Bank of Nigeria regulations",
        spacing: { after: 100 }
      }),

      new Paragraph({
        text: "• PCI DSS Framework: Cardholder data protection standards implemented",
        spacing: { after: 100 }
      }),

      new Paragraph({
        text: "• Zero-Trust Architecture: Bank-level security with continuous verification",
        spacing: { after: 100 }
      }),

      new Paragraph({
        text: "• Real-time AML/KYC: Automated screening and compliance monitoring",
        spacing: { after: 400 }
      }),

      // Core Banking Features
      new Paragraph({
        text: "Core Banking Features",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 200 }
      }),

      new Paragraph({
        children: [
          new TextRun({ text: "For Your Customers", bold: true })
        ],
        spacing: { after: 100 }
      }),

      new Paragraph({
        text: "✓ Instant Account Opening - Digital KYC with 60% faster onboarding\n✓ Real-Time Transfers - Internal and external transfers with instant settlement\n✓ Bill Payments - Comprehensive bill payment integration\n✓ Savings Products - Multiple savings options with intelligent goal tracking\n✓ Loan Services - AI-powered credit scoring and instant loan decisions\n✓ Transaction History - Complete audit trails with advanced search\n✓ Multi-Channel Notifications - SMS, email, push, voice, and in-app alerts\n✓ 24/7 AI Support - Intelligent chatbot resolving 85% of queries automatically",
        spacing: { after: 200 }
      }),

      new Paragraph({
        children: [
          new TextRun({ text: "For Your Institution", bold: true })
        ],
        spacing: { after: 100 }
      }),

      new Paragraph({
        text: "✓ Multi-Tenant Architecture - One platform serving multiple branches\n✓ White-Label Branding - Complete customization with your bank's identity\n✓ Role-Based Access Control - Granular permissions for staff\n✓ Executive Dashboards - Real-time analytics and business intelligence\n✓ Regulatory Reporting - Automated CBN compliance reports\n✓ Fraud Monitoring - AI-enhanced pattern detection\n✓ Audit Logging - Immutable transaction records\n✓ NIBSS Integration Ready - Interbank transfers via NIBSS",
        spacing: { after: 400 }
      }),

      // Performance Metrics
      new Paragraph({
        text: "Proven Performance",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 200 }
      }),

      new Paragraph({
        text: "Metric                          | OrokiiPay        | Industry Standard",
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: "API Response Time         | <150ms           | <200ms",
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: "System Uptime             | 99.95%           | 99.9%",
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: "Fraud Detection           | <5ms             | <500ms",
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: "Support Automation        | 85% AI-resolved  | 40-60%",
        spacing: { after: 100 }
      }),
      new Paragraph({
        text: "Deployment Speed          | 3-5 minutes      | 1-2 hours",
        spacing: { after: 400 }
      }),

      // Implementation
      new Paragraph({
        text: "Implementation & Support",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 200 }
      }),

      new Paragraph({
        children: [
          new TextRun({ text: "Fast Time to Market", bold: true })
        ],
        spacing: { after: 100 }
      }),

      new Paragraph({
        text: "• Production Deployment: Live in 4-6 weeks from contract signing\n• Staff Training: Comprehensive training program for your team\n• 24/7 Technical Support: Dedicated support team\n• Regular Updates: Continuous feature enhancements",
        spacing: { after: 200 }
      }),

      new Paragraph({
        children: [
          new TextRun({ text: "Flexible Pricing", bold: true })
        ],
        spacing: { after: 100 }
      }),

      new Paragraph({
        text: "• SaaS Model: Subscription-based with no large upfront investment\n• Scalable Plans: Grow from hundreds to millions of customers\n• Transparent Costs: No hidden fees, clear pricing structure\n• ROI Guarantee: 80% operational cost reduction in first year",
        spacing: { after: 400 }
      }),

      // Customer Success
      new Paragraph({
        text: "Customer Success Stories",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 200 }
      }),

      new Paragraph({
        children: [
          new TextRun({ text: "First Midas Microfinance Bank (FMFB)", bold: true })
        ],
        spacing: { after: 100 }
      }),

      new Paragraph({
        children: [
          new TextRun({
            text: "\"OrokiiPay has transformed how we serve our customers. The AI assistant alone has reduced our support calls by 75%, and our customers love the voice banking feature.\"",
            italics: true
          })
        ],
        spacing: { after: 200 }
      }),

      new Paragraph({
        children: [
          new TextRun({ text: "Results:", bold: true })
        ],
        spacing: { after: 100 }
      }),

      new Paragraph({
        text: "• 60% faster customer onboarding\n• 75% reduction in support tickets\n• 45% adoption of voice transactions\n• 99.8% transaction success rate",
        spacing: { after: 400 }
      }),

      // Contact Information
      new Paragraph({
        text: "Get Started Today",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 200 }
      }),

      new Paragraph({
        text: "Schedule a Demo: See OrokiiPay in action with a personalized demonstration",
        spacing: { after: 100 }
      }),

      new Paragraph({
        text: "Free Trial: 30-day trial with full feature access for your institution",
        spacing: { after: 100 }
      }),

      new Paragraph({
        text: "Custom Implementation: We'll tailor the platform to your specific needs",
        spacing: { after: 200 }
      }),

      new Paragraph({
        children: [
          new TextRun({ text: "Contact Information", bold: true })
        ],
        spacing: { after: 100 }
      }),

      new Paragraph({
        text: "Website: https://orokiipay.com",
        spacing: { after: 100 }
      }),

      new Paragraph({
        text: "Email: sales@orokiipay.com",
        spacing: { after: 100 }
      }),

      new Paragraph({
        text: "Phone: +234 (0) 800 OROKII PAY",
        spacing: { after: 100 }
      }),

      new Paragraph({
        text: "Demo Environment: https://fmfb-34-59-143-25.nip.io",
        spacing: { after: 400 }
      }),

      // Special Offer
      new Paragraph({
        text: "Special Launch Offer",
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 200 }
      }),

      new Paragraph({
        children: [
          new TextRun({ text: "Sign up in Q4 2025 and receive:", bold: true })
        ],
        spacing: { after: 100 }
      }),

      new Paragraph({
        text: "✓ 50% discount on first year subscription\n✓ Free implementation and training\n✓ Priority support for 6 months\n✓ Custom branding and white-labeling included",
        spacing: { after: 400 }
      }),

      // Footer
      new Paragraph({
        text: "_______________________________________________________________",
        alignment: AlignmentType.CENTER,
        spacing: { before: 400, after: 200 }
      }),

      new Paragraph({
        children: [
          new TextRun({
            text: "OrokiiPay - Empowering Financial Institutions with Intelligent Banking Technology",
            italics: true
          })
        ],
        alignment: AlignmentType.CENTER,
        spacing: { after: 100 }
      }),

      new Paragraph({
        children: [
          new TextRun({
            text: "Designed in Nigeria, Built for the World",
            bold: true,
            italics: true
          })
        ],
        alignment: AlignmentType.CENTER
      })
    ]
  }]
});

// Generate and save the document
const outputPath = path.join(__dirname, '..', 'OROKIIPAY_ONE_PAGER.docx');

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(outputPath, buffer);
  console.log('✅ OrokiiPay One-Pager DOCX created successfully!');
  console.log(`📄 File location: ${outputPath}`);
  console.log(`📊 File size: ${(buffer.length / 1024).toFixed(2)} KB`);
}).catch(error => {
  console.error('❌ Error creating DOCX:', error);
  process.exit(1);
});
