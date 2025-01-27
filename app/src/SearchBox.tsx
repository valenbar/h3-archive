import React from 'react'
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiSearchBar,
  EuiSpacer,
  EuiSwitch,
  Query,
  SearchFilterConfig,
  useIsWithinBreakpoints
} from '@elastic/eui'
import { useDispatch, useSelector } from 'react-redux'
import { setAll as setAllEvents } from './data/eventsSlice'
import axios from 'axios'

const SearchBox = ({
  setQuery,
  setFilteredEvents,
  query,
  searchTranscripts,
  isLoading,
  setLoading,
}) => {  
  const [searchAbortController, setSearchAbortController] = React.useState(new AbortController())
  const dispatch = useDispatch()
  const people = useSelector(state => state.people.value)
  const isMobile = useIsWithinBreakpoints(['xs', 's'])

  const nestedFields = [
    "person",
    "date"
  ]

  // React.useEffect(() => {
  //   onSearchChange(searchAbortController, setSearchAbortController, nestedFields, setQuery, setFilteredEvents, searchTranscripts, setLoading)(query)
  // }, [searchTranscripts, query && query.text])

  const fields = {
    person: {
      type: "string",
      valueDescription: "the person",
      validate: v => {
        if (people.find(p => p.person_id === v) === undefined) {
          throw new Error(`Person with ID [${v}] not found`)
        }
      }
    },
    category: {
      type: "string",
      valueDescription: "the category of the event"
    },
    date: {
      type: "date",
      valueDescription: "the date of the event"
    }
  }

  const filters: SearchFilterConfig[] = [
    {
      type: 'field_value_selection',
      field: 'people.person_id',
      name: 'Person',
      multiSelect: 'or',
      options: (people && people.map(p => ({
        value: p.person_id,
        name: p.display_name || `${p.first_name} ${p.last_name}`,
      }))) || []
    },
    {
      type: 'field_value_selection',
      field: 'category',
      name: 'Category',
      multiSelect: 'or',
      options: [
        {
          "value": "video",
          "name": "Video",
        },
        {
          "value": "podcast",
          "name": "Podcast",
        },
        {
          "value": "major",
          "name": "Major Event",
        },
        {
          "value": "controversy",
          "name": "Controversy",
        }
      ],
    }
  ]

  return (<div>
    <EuiSpacer size="s" />
    <EuiFlexGroup gutterSize="m" alignItems="center">
      <EuiFlexItem grow>
        <EuiSearchBar
          key="search"
          onChange={s => setQuery(s.query)}
          query={query}
          box={{
            schema: {
              fields: fields,
            },
            isLoading,
          }}
          filters={filters}
        />
      </EuiFlexItem>
    </EuiFlexGroup>
    <EuiSpacer size="s" />
  </div>)
}

export default SearchBox;