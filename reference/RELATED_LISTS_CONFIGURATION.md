# Related Lists Configuration Guide

This guide explains how to configure the fields displayed in the related lists on the admin match edit page.

## Overview

The related lists feature displays child records (media and player_stats) associated with a match. Each related list shows a configurable set of fields in a table format.

## Location

The related lists are implemented in:
- Component: `/src/components/admin/RelatedList.tsx`
- Usage: `/src/app/spurs-women/admin/page.tsx` (lines 2084-2172)

## Configuring Media Related Lists

Media records are grouped by `media_type` and displayed as separate related lists. To change the fields displayed for media, modify the `columns` array in the admin page:

```typescript
<RelatedList
  title={`${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)}`}
  records={mediaRecords}
  columns={[
    { key: 'title', label: 'Title' },
    { key: 'url', label: 'URL', render: (value: unknown) => {
      const url = value as string;
      return (
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
          {url.length > 50 ? `${url.substring(0, 50)}...` : url}
        </a>
      );
    }},
    { key: 'caption', label: 'Caption' },
    // Add more columns here
  ]}
  // ... other props
/>
```

### Media Column Configuration

Each column object has:
- `key`: The field name from the Media interface
- `label`: The display label for the column header
- `render` (optional): A custom render function for complex display logic

### Available Media Fields

From the Media interface:
- `id`: Unique identifier
- `match_id`: Foreign key to the match
- `type`: Media type ('photo', 'photo album', 'article', 'social media', 'video-external')
- `title`: Media title
- `url`: Media URL
- `caption`: Media caption/description
- `sort_order`: Display order
- `created_at`: Creation timestamp
- `updated_at`: Last update timestamp

## Configuring Player Stats Related List

To change the fields displayed for player stats, modify the `columns` array:

```typescript
<RelatedList
  title="Player Stats"
  records={relatedPlayerStats}
  columns={[
    {
      key: 'player_id',
      label: 'Player',
      render: (value: unknown) => {
        const playerId = value as string;
        const player = players.find(p => p.id === playerId);
        return player ? `${player.first_name} ${player.last_name}` : playerId;
      }
    },
    { key: 'started', label: 'Started', render: (value: unknown) => (value as boolean) ? 'Yes' : 'No' },
    { key: 'captain', label: 'Captain', render: (value: unknown) => (value as boolean) ? 'Yes' : 'No' },
    { key: 'goals', label: 'Goals' },
    { key: 'assists', label: 'Assists' },
    // Add more columns here
  ]}
  // ... other props
/>
```

### Player Stats Column Configuration

Each column object has:
- `key`: The field name from the PlayerStats interface
- `label`: The display label for the column header
- `render` (optional): A custom render function for complex display logic

### Available Player Stats Fields

From the PlayerStats interface:
- `id`: Unique identifier
- `player_id`: Foreign key to the player
- `match_id`: Foreign key to the match
- `team_id`: Foreign key to the team
- `started`: Whether player started the match (boolean)
- `captain`: Whether player was captain (boolean)
- `was_substitute`: Whether player was a substitute (boolean)
- `was_unused_substitute`: Whether player was an unused substitute (boolean)
- `minute_on`: Minute player came on (number or null)
- `minute_off`: Minute player went off (number or null)
- `minutes_played`: Total minutes played (number)
- `goals`: Goals scored (number)
- `assists`: Assists made (number)
- `yellow_cards`: Yellow cards received (number)
- `red_cards`: Red cards received (number)
- `clean_sheet`: Whether player kept a clean sheet (boolean or null)
- `saves`: Number of saves (number or null)
- `shots`: Total shots (number)
- `shots_on_target`: Shots on target (number)
- `passes_completed`: Passes completed (number or null)
- `passes_attempted`: Passes attempted (number or null)
- `tackles`: Tackles made (number or null)
- `interceptions`: Interceptions made (number or null)
- `clearances`: Clearances made (number or null)
- `fouls_committed`: Fouls committed (number or null)
- `fouls_won`: Fouls won (number or null)
- `offsides': Offsides (number or null)
- `player_rating`: Player rating (number or null, 0-10 scale)
- `player_of_the_match`: Whether player was player of the match (boolean)

## Custom Render Functions

Custom render functions allow you to format data in specific ways:

### Basic Type Casting
```typescript
{ key: 'goals', label: 'Goals', render: (value: unknown) => (value as number).toString() }
```

### Boolean to Text
```typescript
{ key: 'started', label: 'Started', render: (value: unknown) => (value as boolean) ? 'Yes' : 'No' }
```

### Foreign Key Lookup
```typescript
{
  key: 'player_id',
  label: 'Player',
  render: (value: unknown, record: PlayerStats) => {
    const playerId = value as string;
    const player = players.find(p => p.id === playerId);
    return player ? `${player.first_name} ${player.last_name}` : playerId;
  }
}
```

### Conditional Rendering
```typescript
{
  key: 'player_rating',
  label: 'Rating',
  render: (value: unknown) => {
    const rating = value as number | null;
    if (rating === null) return '-';
    if (rating >= 8) return <span className="text-green-400">{rating}</span>;
    if (rating >= 6) return <span className="text-yellow-400">{rating}</span>;
    return <span className="text-red-400">{rating}</span>;
  }
}
```

### URL Links
```typescript
{
  key: 'url',
  label: 'URL',
  render: (value: unknown) => {
    const url = value as string;
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
        {url.length > 50 ? `${url.substring(0, 50)}...` : url}
      </a>
    );
  }
}
```

## Adding New Related Lists

To add a new related list for a different entity type:

1. Add state for the related records in the admin page:
```typescript
const [relatedNewEntity, setRelatedNewEntity] = useState<NewEntity[]>([]);
```

2. Fetch the related records in `handleEditMatch`:
```typescript
const newEntityRes = await callAdminApi('new-entity', 'GET');
if (newEntityRes.data) {
  const allNewEntity = newEntityRes.data as NewEntity[];
  setRelatedNewEntity(allNewEntity.filter(ne => ne.match_id === match.id));
}
```

3. Add the RelatedList component in the related tab:
```typescript
<RelatedList
  title="New Entity"
  records={relatedNewEntity}
  columns={[
    { key: 'field1', label: 'Field 1' },
    { key: 'field2', label: 'Field 2' },
  ]}
  onNew={() => {
    // Set up form for new record
    setShowNewEntityModal(true);
  }}
  onRecordClick={(entity) => handleEditNewEntity(entity)}
  emptyMessage="No new entity records found"
/>
```

4. Create a modal for creating new records (similar to the media and player stats modals)

## RelatedList Component Props

The `RelatedList` component accepts the following props:

```typescript
interface RelatedListProps<T> {
  title: string;              // Display title for the list
  records: T[];              // Array of records to display
  columns: ColumnConfig<T>[]; // Column configuration
  onNew?: () => void;        // Callback for "New" button
  onRecordClick?: (record: T) => void; // Callback for clicking a record
  emptyMessage?: string;      // Message when no records exist
}
```

## Best Practices

1. **Keep column labels concise**: Use short, clear labels for column headers
2. **Use custom renders for complex data**: Foreign keys, booleans, and formatted data should use render functions
3. **Limit displayed columns**: Show only the most relevant fields to avoid overwhelming the UI
4. **Group related fields**: For player stats, group related statistics together (e.g., goals, assists, cards)
5. **Handle null values gracefully**: Use render functions to display '-' or other indicators for null values
6. **Consider responsive design**: On smaller screens, limit the number of columns or use horizontal scrolling

## Example: Adding More Player Stats Columns

To add more statistics to the player stats list:

```typescript
<RelatedList
  title="Player Stats"
  records={relatedPlayerStats}
  columns={[
    {
      key: 'player_id',
      label: 'Player',
      render: (value: unknown) => {
        const playerId = value as string;
        const player = players.find(p => p.id === playerId);
        return player ? `${player.first_name} ${player.last_name}` : playerId;
      }
    },
    { key: 'started', label: 'Started', render: (value: unknown) => (value as boolean) ? 'Yes' : 'No' },
    { key: 'captain', label: 'Captain', render: (value: unknown) => (value as boolean) ? 'Yes' : 'No' },
    { key: 'goals', label: 'Goals' },
    { key: 'assists', label: 'Assists' },
    { key: 'yellow_cards', label: 'YCards' },
    { key: 'red_cards', label: 'RCards' },
    { key: 'shots', label: 'Shots' },
    { key: 'shots_on_target', label: 'On Target' },
    { key: 'player_rating', label: 'Rating', render: (value: unknown) => {
      const rating = value as number | null;
      return rating !== null ? rating.toFixed(1) : '-';
    }},
  ]}
  // ... other props
/>
```
