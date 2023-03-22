import React from 'react'
import {
  EuiBadge,
  EuiCard,
  EuiFlexGroup,
  EuiFlexItem,
  EuiIcon,
  EuiImage,
  EuiPageHeader,
  EuiPanel,
  EuiSearchBar,
  EuiSkeletonRectangle,
  EuiSpacer,
  EuiText,
  EuiToolTip,
  Query,
} from '@elastic/eui'
import axios from 'axios'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'

const categoryLabel = {
  creator: 'Creator',
  crew: 'Crew',
  guest: 'Guest',
  enemy: 'Enemy',
  friend: 'Friend',
  family: 'Family',
  lore: 'Lore',
}

const People = ({
  isEditing,
  addToast,
}) => {
  const people = useSelector((state) => state.people.value)
  const [query, setQuery] = React.useState(undefined)
  const [filteredPeople, setFilteredPeople] = React.useState([])
  const navigate = useNavigate()

  React.useEffect(() => {
    if (query) {
      setFilteredPeople(Query.execute(query, people))
    } else {
      setFilteredPeople(people)
    }
  }, [people, query, setFilteredPeople])

  if (!people) {
    return (<div>
      <EuiPageHeader pageTitle="People" />
      <EuiSpacer size="xl" />
      <PeopleSearch query={query} setQuery={setQuery} />
      <EuiSpacer size="m" />
      <EuiFlexGroup wrap>
        <EuiFlexItem grow={false}>
          <EuiSkeletonRectangle width={200} height={292} />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiSkeletonRectangle width={200} height={292} />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiSkeletonRectangle width={200} height={292} />
        </EuiFlexItem>
      </EuiFlexGroup>
    </div>)
  }

  return (<div>
    <EuiPageHeader pageTitle="People" />
    <EuiSpacer size="xl" />
    <PeopleSearch query={query} setQuery={setQuery} />
    <EuiSpacer size="m" />
    <EuiFlexGroup wrap>
      {filteredPeople && filteredPeople.map((p, i) => {
        const imgWidth = i < 10 ? "200px" : (i < 40 ? "175px" : (i < 75 ? "140px" : (i < 100 ? "110px" : "80px")))
        const innerWidth = i < 10 ? "168px" : (i < 40 ? "143px" : (i < 75 ? "108px" : (i < 100 ? "110px": "80px")))
        const missingImg = (<EuiFlexGroup 
          alignItems="center" 
          justifyContent="center" 
          style={{width: imgWidth, height: imgWidth}}
        >
          <EuiFlexItem grow={false}>
            <EuiIcon size="xxl" type="user" />
          </EuiFlexItem>
        </EuiFlexGroup>)
        return (<EuiFlexItem key={p.person_id} grow={false}>
          {i < 75 && (<EuiCard
            title={(<EuiText style={{width: innerWidth, textOverflow: 'ellipsis', overflow: 'hidden', fontWeight: 'bold', whiteSpace: 'nowrap'}}>{p.display_name || `${p.first_name} ${p.last_name}`}</EuiText>)}
            textAlign="left"
            style={{width: imgWidth}}
            titleSize="xs"
            grow={false}
            paddingSize="s"
            onClick={() => {
              navigate(`/people/${p.person_id}`)
            }}
            image={p.thumb ? (<div>
              <img
                style={{width: imgWidth}}
                src={p.thumb}
                alt={`${p.first_name} ${p.last_name}`}
              />
            </div>) : missingImg}
            footer={(<div>
              <EuiBadge color="primary">{categoryLabel[p.category]}</EuiBadge>
              <EuiBadge color="hollow">{p.event_count}</EuiBadge>
              {p.is_beefing && <EuiBadge color="default">&#x1F969;</EuiBadge>}
            </div>)}
          />)}
          {i >= 75 && (<EuiToolTip content={p.display_name || `${p.first_name} ${p.last_name}`} position="bottom">
            <EuiPanel
              style={{width: imgWidth, height: imgWidth}}
              paddingSize="none"
              onClick={() => {
                navigate(`/people/${p.person_id}`)
              }}
            >
              {p.thumb ? (<div>
                <EuiImage
                  style={{width: imgWidth, height: imgWidth, borderRadius: "6px"}}
                  src={p.thumb}
                  alt={`${p.first_name} ${p.last_name}`}
                />
              </div>) : missingImg}
            </EuiPanel>
          </EuiToolTip>)}
        </EuiFlexItem>)
      })}
    </EuiFlexGroup>
  </div>)
}

const PeopleSearch = ({
  query,
  setQuery,
}) => {
  const schema = {
    flags: [
      'is_beefing'
    ],
    first_name: {
      type: 'string',
    },
    last_name: {
      type: 'string',
    },
    aliases: {
      type: 'string',
    },
    display_name: {
      type: 'string',
    },
    category: {
      type: 'string',
    }
  }

  const filters = [
    {
      type: 'field_value_selection',
      field: 'category',
      name: 'Category',
      multiSelect: 'or',
      options: [
        {
          value: 'creator',
          name: 'Creator',
        },
        {
          value: 'crew',
          name: 'Crew',
        },
        {
          value: 'friend',
          name: 'Friend',
        },
        {
          value: 'enemy',
          name: 'Enemy',
        },
        {
          value: 'guest',
          name: 'Guest',
        }
      ]
    },
    {
      type: 'is',
      field: 'is_beefing',
      name: 'Is Beefing \uD83E\uDD69',
    }
  ]

  return (<div>
    <EuiSearchBar
      onChange={onSearch(setQuery)}
      filters={filters}
      box={{
        incremental: true,
        schema: schema,
      }}
    />
  </div>)
}

const onSearch = setQuery => query => {
  setQuery(query.query)
}

export default People