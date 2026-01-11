export default function SalesforceOrgsContent() {
  const orgsData = [
    {
      name: 'Developer Edition',
      link: 'https://developer.salesforce.com/signup',
      expires: 'Never'
    },
    {
      name: 'Developer Edition with Einstein Prediction Builder and Einstein Next Best Action',
      link: 'https://trailhead.salesforce.com/promo/orgs/put-predictions-into-action-with-next-best-action',
      expires: 'Never'
    },
    {
      name: 'CRM Analytics',
      link: 'https://trailhead.salesforce.com/promo/orgs/earn-crm-analytics-superbadge',
      expires: 'Never'
    },
    {
      name: 'Pardot (MC Account Engagement)',
      link: 'https://trailhead.salesforce.com/promo/orgs/pardot-de',
      expires: 'Never'
    },
    {
      name: 'CPQ',
      link: 'https://trailhead.salesforce.com/promo/orgs/cpqtrails',
      expires: 'Never'
    },
    {
      name: 'Tableau Public',
      link: 'https://id.tableau.com/register',
      expires: 'Never'
    },
    {
      name: 'Slack (Free Tier)',
      link: 'https://slack.com/get-started#/createnew',
      expires: 'Never'
    },
    {
      name: 'Jira (Free Tier)',
      link: 'https://www.atlassian.com/software/jira/free',
      expires: 'Never'
    },
    {
      name: 'Clayton (Free Tier)',
      link: 'https://www.getclayton.com/pricing',
      expires: 'Never'
    },
    {
      name: 'Omnistudio',
      link: 'https://trailhead.salesforce.com/promo/orgs/omnistudiotrails',
      expires: '180 days'
    },
    {
      name: 'Field Service',
      link: 'https://trailhead.salesforce.com/en/promo/orgs/fsc_managed',
      expires: '90 days'
    },
    {
      name: 'Tableau',
      link: 'https://www.tableau.com/products/trial',
      expires: '30 days'
    },
    {
      name: 'Health Cloud',
      link: 'https://developer.salesforce.com/free-trials/comparison/health-cloud',
      expires: '30 days'
    },
    {
      name: 'Education Cloud',
      link: 'https://developer.salesforce.com/free-trials/comparison/education-cloud',
      expires: '30 days'
    },
    {
      name: 'Non-Profit Cloud',
      link: 'https://developer.salesforce.com/free-trials/comparison/nonprofit-cloud',
      expires: '30 days'
    },
    {
      name: 'Financial Services Cloud',
      link: 'https://developer.salesforce.com/free-trials/comparison/financial-services-cloud',
      expires: '30 days'
    },
    {
      name: 'Manufacturing Cloud',
      link: 'https://developer.salesforce.com/free-trials/comparison/manufacturing-cloud',
      expires: '30 days'
    },
    {
      name: 'Energy & Utilities Cloud',
      link: 'https://developer.salesforce.com/free-trials/comparison/energy-utilities-cloud',
      expires: '30 days'
    },
    {
      name: 'Media Cloud',
      link: 'https://developer.salesforce.com/free-trials/comparison/media-cloud',
      expires: '30 days'
    },
    {
      name: 'Communications Cloud',
      link: 'https://developer.salesforce.com/free-trials/comparison/communications-cloud',
      expires: '30 days'
    },
    {
      name: 'Automotive Cloud',
      link: 'https://developer.salesforce.com/free-trials/comparison/automotive-cloud',
      expires: '30 days'
    },
    {
      name: 'Consumer Goods Cloud',
      link: 'https://developer.salesforce.com/free-trials/comparison/consumer-goods-cloud',
      expires: '30 days'
    },
    {
      name: 'Feedback Management',
      link: 'https://developer.salesforce.com/free-trials/comparison/feedback-management',
      expires: '30 days'
    },
    {
      name: 'Net Zero Cloud',
      link: 'https://developer.salesforce.com/free-trials/comparison/net-zero-cloud',
      expires: '30 days'
    },
    {
      name: 'Loyalty Management',
      link: 'https://developer.salesforce.com/free-trials/comparison/loyalty-management',
      expires: '30 days'
    },
    {
      name: 'Public Sector Solutions',
      link: 'https://developer.salesforce.com/free-trials/comparison/public-sector',
      expires: '30 days'
    },
    {
      name: 'Salesforce Scheduler',
      link: 'https://developer.salesforce.com/free-trials/comparison/salesforce-scheduler',
      expires: '30 days'
    },
    {
      name: 'Mulesoft Anypoint',
      link: 'https://anypoint.mulesoft.com/login/signup',
      expires: '30 days'
    },
    {
      name: 'Quip',
      link: 'https://quip.com/account/login',
      expires: '30 days'
    }
  ];

  return (
    <div className="blog-article">
      <article className="blog-content">
        <div className="outdated-banner">
          <div className="banner-icon">⚠️</div>
          <div className="banner-content">
            <h3 className="banner-title">Page Outdated</h3>
            <p className="banner-text">This page is currently outdated and will be updated in due course. Some links may no longer be valid.</p>
          </div>
        </div>
        
        <h1 className="blog-main-title">Salesforce Free and Trial Orgs</h1>
        
        <div className="blog-intro">
          <p>A curation of links to sign up for free or trial versions of various Salesforce orgs, as well as related applications.</p>
        </div>

        <div className="orgs-table-container">
          <table className="orgs-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Link</th>
                <th>Expires</th>
              </tr>
            </thead>
            <tbody>
              {orgsData.map((org, index) => (
                <tr key={index}>
                  <td>{org.name}</td>
                  <td>
                    <a 
                      href={org.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="org-link"
                    >
                      {org.link}
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        height="16" 
                        viewBox="0 96 960 960" 
                        width="16" 
                        className="external-link-icon"
                      >
                        <path d="M180 936q-24 0-42-18t-18-42V276q0-24 18-42t42-18h279v60H180v600h600V597h60v279q0 24-18 42t-42 18H180Zm202-219-42-43 398-398H519v-60h321v321h-60V319L382 717Z" fill="currentColor"/>
                      </svg>
                    </a>
                  </td>
                  <td>{org.expires}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="blog-image">
          <img 
            src="/img/orgsPreview.png" 
            alt="Salesforce Orgs Preview"
            className="content-image"
          />
        </div>
      </article>
    </div>
  );
}
