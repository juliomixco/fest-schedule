import { useEffect, useState } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useFestivalStore, useSelectionStore } from './stores'
import { Header } from './components/layout/Header'
import { TimelineView } from './components/timeline'
import { MyScheduleView } from './components/schedule/MyScheduleView'
import { FestivalManager } from './components/festivals/FestivalManager'
import './index.css'

const queryClient = new QueryClient()

type View = 'timeline' | 'schedule' | 'festivals'

function AppContent() {
  const [view, setView] = useState<View>('timeline')
  const { festivals, activeFestivalId, activeDayId, loadFestivals } = useFestivalStore()
  const { loadSelections } = useSelectionStore()

  useEffect(() => { loadFestivals() }, [])
  useEffect(() => { if (activeFestivalId) loadSelections(activeFestivalId) }, [activeFestivalId])

  const festival = festivals.find((f) => f.id === activeFestivalId)
  const activeDay = festival?.days.find((d) => d.id === activeDayId)

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col dark">
      <Header view={view} setView={setView} />
      <main className="flex-1 overflow-hidden">
        {view === 'timeline' && (
          festival && activeDay
            ? <TimelineView day={activeDay} festivalId={festival.id} />
            : (
              <div className="flex flex-col items-center justify-center h-64 text-neutral-500 gap-3">
                <p className="text-lg">No festival loaded.</p>
                <button
                  className="bg-violet-600 hover:bg-violet-500 text-white px-6 py-2 rounded-lg text-sm font-semibold"
                  onClick={() => setView('festivals')}
                >Import a festival</button>
              </div>
            )
        )}
        {view === 'schedule' && festival && <MyScheduleView festival={festival} festivalId={festival.id} />}
        {view === 'schedule' && !festival && (
          <div className="flex items-center justify-center h-64 text-neutral-500">
            <p>No festival loaded.</p>
          </div>
        )}
        {view === 'festivals' && <FestivalManager />}
      </main>
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  )
}
