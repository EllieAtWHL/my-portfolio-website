import { Button } from '@/components/Button';

// Example usage patterns for the Button component

export function ButtonExamples() {
  return (
    <div className="space-y-4 p-8">
      {/* Primary buttons */}
      <div className="flex gap-4">
        <Button variant="primary" size="sm">Small Primary</Button>
        <Button variant="primary" size="md">Medium Primary</Button>
        <Button variant="primary" size="lg">Large Primary</Button>
      </div>

      {/* Secondary buttons */}
      <div className="flex gap-4">
        <Button variant="secondary" size="sm">Small Secondary</Button>
        <Button variant="secondary" size="md">Medium Secondary</Button>
        <Button variant="secondary" size="lg">Large Secondary</Button>
      </div>

      {/* Ghost buttons */}
      <div className="flex gap-4">
        <Button variant="ghost" size="sm">Ghost Small</Button>
        <Button variant="ghost" size="md">Ghost Medium</Button>
        <Button variant="ghost" size="lg">Ghost Large</Button>
      </div>

      {/* Buttons with icons */}
      <div className="flex gap-4">
        <Button variant="primary" icon="→" iconPosition="left">
          Left Icon
        </Button>
        <Button variant="secondary" icon="→" iconPosition="right">
          Right Icon
        </Button>
      </div>

      {/* Full width button */}
      <Button variant="primary" fullWidth>
        Full Width Button
      </Button>

      {/* Loading state */}
      <div className="flex gap-4">
        <Button variant="primary" loading>
          Loading...
        </Button>
        <Button variant="secondary" disabled>
          Disabled
        </Button>
      </div>

      {/* As different elements */}
      <div className="flex gap-4">
        <Button variant="primary" asChild>
          <a href="/about">As Link</a>
        </Button>
        <Button variant="secondary" onClick={() => console.log('clicked')}>
          As Button
        </Button>
      </div>
    </div>
  );
}
