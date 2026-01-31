import { ChangesRepository } from '@boat-monitor/database';

const changesRepo = new ChangesRepository();

export default async function HistoryPage() {
  const changes = await changesRepo.findRecent(50);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Change History</h2>
        <p className="text-gray-600">Timeline of all detected changes</p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        {changes.length > 0 ? (
          <div className="space-y-4">
            {changes.map((change) => (
              <div key={change.id} className="border-l-4 border-blue-500 pl-4 py-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      {change.priority === 'CRITICAL' && (
                        <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                          🚨 CRITICAL
                        </span>
                      )}
                      {change.priority === 'IMPORTANT' && (
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                          ⚠️ IMPORTANT
                        </span>
                      )}
                      {change.priority === 'INFO' && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          ℹ️ INFO
                        </span>
                      )}
                      <span className="text-sm font-medium text-gray-700">{change.type}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {change.description}
                    </h3>
                    {change.matchedKeywords && change.matchedKeywords.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {change.matchedKeywords.map((keyword, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs"
                          >
                            {keyword}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="text-sm text-gray-500 mt-2">
                      Detected at: {new Date(change.detectedAt).toLocaleString('de-DE')}
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-sm text-gray-600">
                      Confidence
                    </div>
                    <div className="text-2xl font-bold text-blue-600">
                      {Math.round(change.confidence * 100)}%
                    </div>
                  </div>
                </div>
                {change.diff && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-700">
                      View diff
                    </summary>
                    <pre className="mt-2 p-3 bg-gray-50 rounded text-xs overflow-x-auto">
                      {change.diff}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">No changes detected yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
