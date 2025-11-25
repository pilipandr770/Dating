import { X } from 'lucide-react';

export default function TestModal({ booking, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Test Modal</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-green-100 rounded-lg">
            <p className="font-bold text-green-800">✓ Modal is working!</p>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm"><strong>Booking ID:</strong> {booking.id}</p>
            <p className="text-sm"><strong>Amount:</strong> {booking.total_amount} RUB</p>
          </div>

          <button
            onClick={onClose}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700"
          >
            Close Test Modal
          </button>
        </div>
      </div>
    </div>
  );
}
