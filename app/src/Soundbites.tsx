import React from 'react'
import {
  EuiBadge,
  EuiButtonIcon,
  EuiFlexGroup,
  EuiFlexItem,
  EuiImage,
  EuiPageHeader,
  EuiPanel,
  EuiSearchBar,
  EuiSkeletonRectangle,
  EuiSpacer,
  EuiText,
  EuiToolTip,
  Query,
  useIsWithinBreakpoints,
} from '@elastic/eui'
import { useSelector } from 'react-redux'
import { BsPerson } from 'react-icons/bs'

const Soundbites = () => {
  const soundbites = useSelector(state => state.soundbites.value)
  const people = useSelector(state => state.people.value)
  const [, setAudios] = React.useState(null)
  const [force, setForce] = React.useState(0)
  const [hovered, setHovered] = React.useState(null)
  const [filteredSoundbites, setFilteredSoundbites] = React.useState([])
  const isMobile = useIsWithinBreakpoints(['xs', 's'])

  const setQuery = (query) => {
    const existingParams = new URLSearchParams(window.location.search)
    if (existingParams.get('q') !== query.text) {
      if (!query.text || query.text === '') {
        existingParams.delete('q')
      } else {
        existingParams.set('q', query.text)
      }
      const newurl = `${window.location.protocol}//${window.location.host}${window.location.pathname}?${existingParams.toString()}`
      window.history.replaceState({path:newurl},'',newurl)
      setForce(force + 1)
    }
  }
  const searchParams = new URLSearchParams(window.location.search)
  const query = searchParams.get('q') && Query.parse(searchParams.get('q'))
  const width = isMobile ? 140 : 175
  const maxTextHeight = isMobile ? 90 : 125

  React.useEffect(() => {
    if (soundbites) {
      if (query) {
        setFilteredSoundbites(Query.execute(query, soundbites.map(soundbite => {
          const person = people && people.find(p => p.person_id === soundbite.person_id)
          return Object.assign({
            won: !!soundbite.winning_year,
            nominated: !!soundbite.winning_year || !!soundbite.nominated_year,
            person: soundbite.person_id,
            personName: person && (person.display_name || `${person.first_name} ${person.last_name}`)
          }, soundbite)
        })))
      } else {
        setFilteredSoundbites(soundbites)
      }
    }
  }, [soundbites, people, query && query.text, setFilteredSoundbites])

  React.useEffect(() => {
    if (soundbites) {
      setAudios(soundbites.map(soundbite => ({
        id: soundbite.soundbite_id,
        audio: new Audio(soundbite.soundbite_file),
      })))
    }
  }, [soundbites])

  if (!soundbites) {
    return (<div>
      <EuiPageHeader pageTitle="Soundbites" />
      <EuiSpacer size="xl" />
      <SoundbiteSearch query={query} setQuery={setQuery} people={[]} soundbites={[]} />
      <EuiSpacer size="m" />
      <EuiFlexGroup wrap>
        <EuiFlexItem grow={false}>
          <EuiSkeletonRectangle width={width} height={width} />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiSkeletonRectangle width={width} height={width} />
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiSkeletonRectangle width={width} height={width} />
        </EuiFlexItem>
      </EuiFlexGroup>
    </div>)
  }

  return (<div>
    <EuiPageHeader pageTitle="Soundbites" />
    <EuiSpacer size={isMobile ? "m" : "xl"} />
    <SoundbiteSearch query={query} setQuery={setQuery} people={people} soundbites={soundbites} />
    <EuiSpacer size="m" />
    <EuiFlexGroup responsive={false} justifyContent={isMobile ? 'spaceEvenly' : undefined} wrap>
      {filteredSoundbites && filteredSoundbites.map(soundbite => {
        const person = people && people.find(p => p.person_id === soundbite.person_id)
        return (<EuiFlexItem 
          key={soundbite.soundbite_id}
          grow={false}
          onMouseEnter={() => {setHovered(soundbite.soundbite_id)}}
          onMouseLeave={() => {setHovered(null)}}
          style={{
            width: `${width}px`,
            height: `${width}px`
          }} 
        >
          <audio src={soundbite.soundbite_file} />
          <EuiPanel
            color="plain" 
            hasBorder 
            grow
            onClick={() => {
              playSoundbite(soundbite)
            }}
            style={{
              borderColor: hovered === soundbite.soundbite_id ? '#5bd45b' : undefined,
            }}
            paddingSize="s"
          >
            {hovered === soundbite.soundbite_id && <EditSoundbiteButton soundbiteId={soundbite.soundbite_id} />}
            <EuiFlexGroup direction="column" style={{height: '100%'}} gutterSize="none">
              <EuiFlexItem grow>
                <EuiFlexGroup gutterSize="s" justifyContent="center" alignItems="center" style={{height: '100%', maxHeight: `${maxTextHeight}px`}}>
                    <EuiFlexItem grow={1}>
                      <EuiText textAlign="center">
                        <p 
                          style={{ 
                            padding: '8px',
                            color: hovered === soundbite.soundbite_id ? '#5bd45b' : undefined,
                            overflow: 'hidden', 
                            maxHeight: `${maxTextHeight}px`,
                          }}
                        >{soundbite.quote ? `“${soundbite.quote}”` : soundbite.alt}
                        </p>
                      </EuiText>
                    </EuiFlexItem>
                </EuiFlexGroup>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiFlexGroup alignItems="flexEnd" responsive={false} gutterSize="s" style={{height: '32px'}}>
                  {person && (<EuiToolTip position="bottom" content={person.display_name || `${person.first_name} ${person.last_name}`}>
                    <EuiFlexItem grow={false}>
                      {person.thumb && (<EuiImage 
                        alt={person.display_name || `${person.first_name} ${person.last_name}`} 
                        width={40} 
                        height={40} 
                        src={person.thumb}
                        style={{
                          borderBottomLeftRadius: '5px',
                          borderTopRightRadius: '5px',
                          position: 'relative',
                          bottom: '-8px',
                          left: '-8px',
                        }}
                      />)}
                      {!person.thumb && (<BsPerson
                        title={person.display_name || `${person.first_name} ${person.last_name}`}
                        style={{
                          width: '28px',
                          height: '28px',
                          position: 'relative',
                          bottom: '-8px',
                          left: '-8px',
                        }}
                      />)}
                    </EuiFlexItem>
                  </EuiToolTip>)}
                  <EuiFlexItem grow />
                  {soundbite.nominated_year && (<EuiFlexItem grow={false}>
                    <EuiBadge style={{cursor: 'pointer'}} title={`Nominated soundbite of the year ${soundbite.nominated_year}`} color="default">&#129352;&nbsp;{soundbite.nominated_year}</EuiBadge>
                  </EuiFlexItem>)}
                  {soundbite.winning_year && (<EuiFlexItem grow={false}>
                    <EuiBadge style={{cursor: 'pointer'}} title={`Won soundbite of the year ${soundbite.winning_year}`} color="default">&#127942;&nbsp;{soundbite.winning_year}</EuiBadge>
                  </EuiFlexItem>)}
                </EuiFlexGroup>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiPanel>
        </EuiFlexItem>)
      })}
    </EuiFlexGroup>
  </div>)
}

const playSoundbite = (soundbite) => {
  new Audio(soundbite.sound_file).play()
}

const SoundbiteSearch = ({
  query,
  setQuery,
  people,
  soundbites,
}) => {
  const isMobile = useIsWithinBreakpoints(['xs', 's'])

  const schema = {
    flags: [
      'won',
      'nominated',
    ],
    quote: {
      type: 'string'
    },
    person: {
      type: 'string'
    },
  }

  const filters = [
    {
      type: 'field_value_selection',
      field: 'person',
      name: 'Person',
      multiSelect: 'or',
      options: people ? people.filter(p => !!soundbites.find(s => s.person_id === p.person_id)).map(p => ({
        value: p.person_id,
        name: p.display_name || `${p.first_name} ${p.last_name}`,
      })) : [],
      operator: 'exact',
    },
    {
      type: 'is',
      field: 'won',
      name: 'Won',
    },
    {
      type: 'is',
      field: 'nominated',
      name: 'Nominated',
    }
  ]

  return (<EuiSearchBar 
    filters={filters}
    box={{
      schema: schema,
      incremental: !isMobile,
    }}
    onChange={onSearch(setQuery)}
    query={query}
  />)
}

const onSearch = setQuery => query => {
  setQuery(query.query)
}

const EditSoundbiteButton = ({
  soundbiteId,
}) => {
  const [hovering, setHovering] = React.useState(false)
  const isMobile = useIsWithinBreakpoints(['xs', 's'])

  return (<div style={{ position: 'relative' }}>
    <div style={{ position: 'absolute', top: '-3px', right: '-3px', opacity: hovering || isMobile ? 1 : '.5' }} onMouseEnter={() => {setHovering(true)}} onMouseLeave={() => {setHovering(false)}}>
      <EuiToolTip content="Suggest an edit">
        <EuiButtonIcon aria-label="edit soundbite" target="_blank" href={`https://github.com/s-nel/h3-archive/edit/main/content/soundbites/${soundbiteId}.json`} iconType="pencil" display="base" />
      </EuiToolTip>
    </div>
  </div>)
}

export default Soundbites