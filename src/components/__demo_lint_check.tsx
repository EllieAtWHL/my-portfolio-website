import { useState } from 'react';

export default function Demo({ condition }: { condition: boolean }) {
  if (condition) {
    const [value] = useState(0);
    return <div>{value}</div>;
  }
  return <div>demo</div>;
}
