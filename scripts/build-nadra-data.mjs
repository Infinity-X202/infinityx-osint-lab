import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const REPO = 'https://github.com/Rayan-Rasheed/Project-Nadra_management_System'

const RAW = `
Ahmad,Faraz,male,Saeed Akhtar,2000,4,19,3230402047899,Punjab,Lahore,Garden town streat#4,Garden town streat#4,Cinoform,2
Rayan,Rasheed,male,Abdul Rasheed,2004,10,25,3130258066437,Punjab,Lahore,Mugalpura,Bahawalpur,Pfizer,1
Mukram,Ali,male,Ali Mukhtar,2003,12,31,3130260006148,punjab,Lahore,Lahore Uet,Faisalabad,pfizer,1
Abdullah,irshad,male,Akram rizwan,2000,12,1,3130240004183,punjab,lahore,Lahore model town,Awan town,cinoform,1
ali,bhai,male,kuldeep,2004,12,1,3130200002300,punjab,Lahore,lahore,lahoe,pfizer,1
zunaira,mukhtar,female,mukhtar hassan,1996,12,31,3130258077436,punjab,Lahore,lake city,mugalpura,pfizer,1
hammad,asghar,male,Asghar sultan,2001,12,23,3130230006184,punjab,Lahore,Lahore jh,Lahore hgd,pfizer,2
Faraz,Ahmad,male,Ahmad Ashfaq,1996,12,23,3130270006178,punjab,Lahore,Opposite Anarkali bazar,Mugalpura,pfizer,2
Zaid,Majid,male,Majid Iqbal,1986,1,21,3130550005185,Punjab,Lahore,Bhagwanpura street#3,Okara paki mandi,cinofom,1
Waqas,Afzal,male,Afzal Khan,1965,12,21,3130530003187,Punjab,Lahore,DHA phase 8,DHA phase 8,cinoform,1
Faraz,Ahmad,male,Ahmad Ashfaq,1955,12,23,3130270006178,punjab,Lahore,Opposite Anarkali bazar,Mugalpura,pfizer,2
Zaid,Majid,male,Majid Iqbal,1955,1,21,3130550005185,Punjab,Lahore,Bhagwanpura street#3,Okara paki mandi,cinofom,1
Waqas,Afzal,male,Afzal Khan,1918,12,21,3130530003187,Punjab,Lahore,DHA phase 8,DHA phase 8,cinoform,1
Zaid,Majid,male,majid,2004,12,12,3130200222087,punjab,fsd,lahore,faislabad,cinofom,1
Hassan,Ali,male,Ali mukhtar,2001,12,23,3130260006174,Punjab,fsd,Lahore ,mugalpura lahore,cinoform,1
Ali,Ahmad,male,hammad,2001,1,11,3130260006184,punjab,Lahore,jds jdsj,jdfj jdfj,pfizer,2
`.trim()

function slug(first, last) {
  return `${first}.${last}`.toLowerCase().replace(/[^a-z0-9.]/g, '')
}

const rows = RAW.split('\n').filter(Boolean).map((line, i) => {
  const p = line.split(',')
  const [
    firstName,
    lastName,
    gender,
    fatherName,
    y,
    m,
    d,
    cnic,
    province,
    city,
    currentAddress,
    permanentAddress,
    vaccine,
    doses,
  ] = p
  const cnicDigits = cnic.replace(/\D/g, '')
  const id = `NR-${String(i + 1).padStart(4, '0')}`
  const fullName = `${firstName} ${lastName}`.replace(/\s+/g, ' ').trim()
  return {
    id,
    firstName,
    lastName,
    fullName,
    gender,
    fatherName,
    birthDate: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
    cnic: cnicDigits,
    suffixKeys: cnicDigits.slice(-4),
    province,
    city,
    currentAddress,
    permanentAddress,
    vaccine,
    doses,
    username: slug(firstName, lastName),
  }
})

const csv = [
  'id,name,cnic,province,city,currentAddress,permanentAddress,fatherName,gender,birthDate,vaccine,doses',
  ...rows.map((r) =>
    [
      r.id,
      `"${r.fullName}"`,
      r.cnic,
      `"${r.province}"`,
      `"${r.city}"`,
      `"${r.currentAddress}"`,
      `"${r.permanentAddress}"`,
      `"${r.fatherName}"`,
      r.gender,
      r.birthDate,
      r.vaccine,
      r.doses,
    ].join(','),
  ),
].join('\n')

writeFileSync(join(root, 'public', 'nadra-demo.csv'), csv, 'utf8')

const records = rows.map((r, i) => ({
  id: r.id,
  name: r.fullName,
  username: r.username,
  email: `${r.username}@nadra-lab.example`,
  phone: '',
  cnic: r.cnic,
  invoiceNumber: '',
  businessName: '',
  organization: `${r.province} · NADRA Demo`,
  address: r.currentAddress,
  permanentAddress: r.permanentAddress,
  city: r.city,
  country: 'Pakistan',
  province: r.province,
  fatherName: r.fatherName,
  gender: r.gender,
  birthDate: r.birthDate,
  prize: r.vaccine,
  prizeAmount: `${r.doses} dose(s)`,
  datasetId: 'NADRA_GITHUB_DEMO',
  datasetName: 'Project-Nadra_management_System',
  source: 'Research Dataset',
  sourceRepo: REPO,
  lastIndexed: '2026-09-11T10:00:00.000Z',
  domains: ['nadra-lab.example'],
  profiles: [],
  relatedIds: [],
  notes: `Father: ${r.fatherName} · Permanent: ${r.permanentAddress} · Indexed from GitHub demo file nadra_data.txt`,
  suffixKeys: r.suffixKeys,
}))

const ts = `import type { DatasetMeta, IntelRecord } from '@/types'

export const NADRA_REPO_URL = '${REPO}'

export const NADRA_DATASET: DatasetMeta = {
  id: 'NADRA_GITHUB_DEMO',
  name: 'Project-Nadra_management_System',
  fileType: 'SYNTHETIC',
  importDate: '2026-09-11T10:00:00.000Z',
  status: 'Verified',
  schema: ['name', 'cnic', 'province', 'city', 'address', 'fatherName', 'gender', 'birthDate', 'vaccine'],
  description: 'Educational C++ citizen-record demo indexed from Rayan-Rasheed/Project-Nadra_management_System (nadra_data.txt). Full CNIC for OSINT training.',
  sourceKind: 'Research Dataset',
  synthetic: true,
}

export const NADRA_RECORDS: IntelRecord[] = ${JSON.stringify(records, null, 2)}
`

writeFileSync(join(root, 'src', 'data', 'nadraRecords.ts'), ts, 'utf8')
console.log('Generated', rows.length, 'NADRA demo records')
