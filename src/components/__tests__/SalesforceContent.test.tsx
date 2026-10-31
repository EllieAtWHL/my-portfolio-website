import { render, screen } from '@testing-library/react';
import SalesforceContent from '../SalesforceContent';

describe('SalesforceContent', () => {
  it('renders the page heading', () => {
    render(<SalesforceContent />);
    expect(screen.getByRole('heading', { name: 'Salesforce', level: 1 })).toBeInTheDocument();
  });

  it('links each project to its page under /salesforce', () => {
    render(<SalesforceContent />);
    expect(screen.getByRole('link', { name: 'Lightning Rollout' })).toHaveAttribute('href', '/salesforce/lightning-rollout');
    expect(screen.getByRole('link', { name: 'Fantasy Football Draft Application' })).toHaveAttribute(
      'href',
      '/salesforce/fantasy-football-draft'
    );
  });

  it('does not link the unfinished Free and Trial Orgs page', () => {
    render(<SalesforceContent />);
    expect(screen.queryByRole('link', { name: /Free and Trial Orgs/ })).not.toBeInTheDocument();
  });
});
