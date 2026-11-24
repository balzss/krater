import { http, HttpResponse } from 'msw'
import { mockLibraryData } from './data'

export const handlers = [
  // GET /data/libraryData.json
  http.get('/data/libraryData.json', () => {
    return HttpResponse.json(mockLibraryData)
  }),
]
