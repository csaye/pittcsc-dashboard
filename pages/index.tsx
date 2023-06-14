import Cell from '@/components/Cell';
import styles from '@/styles/pages/Index.module.scss';
import { useEffect, useMemo, useState } from 'react';

const url = 'https://raw.githubusercontent.com/pittcsc/Summer2024-Internships/dev/README.md';
const separator = '<!-- Please leave a one line gap between this and the table -->\n';

type Internship = {
  name: string;
  location: string;
  notes: string;
  applied: boolean;
};

type AppliedType = 'all' | 'yes' | 'no';

function parseName(text: string) {
  if (text.includes('](')) {
    return text.split('](')[0].slice(1);
  }

  return text;
}

export default function Index() {
  const [internships, setInternships] = useState<Internship[] | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [appliedType, setAppliedType] = useState<AppliedType>('all')

  // filter internships by filter text
  const filteredInternships = useMemo(() => {
    if (!internships) return null
    return internships.filter((internship) => {
      const { name, location, notes, applied } = internship;
      const text = filterText.toLowerCase()
      const textMatch = !filterText ||
        (name.toLowerCase().includes(text) ||
          location.toLowerCase().includes(text) ||
          notes.toLowerCase().includes(text))
      const appliedMatch = appliedType === 'all' ||
        ((appliedType === 'yes') === applied)
      return textMatch && appliedMatch
    })
  }, [internships, filterText, appliedType]);

  // set dark mode on start
  useEffect(() => {
    setDarkMode(window.localStorage.getItem('dark-mode') === 'yes')
  }, []);

  // fetch data from github
  async function getData() {
    setInternships(null);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('An error occurred fetching data');
    }
    const text = await response.text();
    const content = text.split(separator)[1].trim();
    const lines = content.split('\n').slice(2);
    const jobs = lines.map(line => line.split('|').map(text => text.trim()).filter(text => !!text));
    setInternships(jobs.map((job) => ({
      name: job[0],
      location: job[1],
      notes: job[2],
      applied: getApplied(job[0])
    })));

    function getApplied(name: string) {
      const jobName = parseName(name);
      return window.localStorage.getItem(`Applied: ${jobName}`) === 'yes';
    }
  }

  // get data on start
  useEffect(() => {
    getData();
  }, []);

  // updates applied status for given internship
  function updateApplied(applied: boolean, internship: Internship) {
    if (!internships) return;
    const newInternships = internships.slice();
    const index = newInternships.findIndex(i => i.name === internship.name);
    if (index === -1) return;
    newInternships[index].applied = applied;
    setInternships(newInternships);

    // update local storage
    const jobName = parseName(internship.name);
    window.localStorage.setItem(`Applied: ${jobName}`, applied ? 'yes' : 'no');
  }

  function toggleDarkMode() {
    const isDarkMode = !darkMode;
    setDarkMode(isDarkMode);
    window.localStorage.setItem('dark-mode', isDarkMode ? 'yes' : 'no')
  }

  return (
    <div className={darkMode ? `${styles.container} ${styles.darkMode}` : styles.container}>
      <h1>interning.dev</h1>
      <p>
        ⚠️ Not affiliated with{' '}
        <a href="https://pittcsc.org/" target="_blank" rel="noopener noreferrer">PittCSC</a>
      </p>
      <ul>
        <li>
          Data from{' '}
          <a href="https://github.com/pittcsc/Summer2024-Internships" target="_blank" rel="noopener noreferrer">
            PittCSC
          </a>
        </li>
        <li>
          This dashboard is open source!{' '}
          <a href="https://github.com/csaye/interning.dev" target="_blank" rel="noopener noreferrer">
            Star us on GitHub
          </a>
        </li>
        <li>
          Made by{' '}
          <a href="https://github.com/csaye" target="_blank" rel="noopener noreferrer">
            Cooper Saye
          </a>
        </li>
      </ul>
      <div className={styles.buttons}>
        <button onClick={() => toggleDarkMode()}>
          {darkMode ? '☀️' : '🌙'}
        </button>
        <button
          className={styles.refreshButton}
          onClick={() => getData()}
        >
          🔄
        </button>
      </div>
      {internships && <p>You have applied to {internships.filter(i => i.applied).length}/{internships.length} internships!</p>}
      <div className={styles.filters}>
        <input
          value={filterText}
          onChange={e => setFilterText(e.target.value)}
          placeholder="Filter by text..."
        />
        <select
          value={appliedType}
          onChange={e => setAppliedType(e.target.value as AppliedType)}
        >
          <option value='all'>All</option>
          <option value='yes'>Applied</option>
          <option value='no'>Not Applied</option>
        </select>
      </div>
      {
        !filteredInternships ? <p>Loading...</p> :
          !filteredInternships.length ? <p>No internships found</p> :
            <div className={styles.table}>
              <div className={styles.row}>
                <div>Name</div>
                <div>Location</div>
                <div>Notes</div>
                <div>Applied</div>
              </div>
              {
                filteredInternships.map((internship, i) =>
                  <div className={styles.row} key={i}>
                    <Cell text={internship.name} />
                    <Cell text={internship.location} />
                    <Cell text={internship.notes} />
                    <div>
                      <input
                        checked={internship.applied}
                        onChange={e => updateApplied(e.target.checked, internship)}
                        type="checkbox"
                      />
                    </div>
                  </div>
                )
              }
            </div>
      }
    </div>
  );
}
