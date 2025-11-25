import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, AlertTriangle, ArrowRight } from 'lucide-react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

/**
 * VerificationGate - компонент для проверки верификации пользователя
 * Оборачивает защищённый контент и перенаправляет на страницу верификации если не пройдена
 * 
 * Использование:
 * <VerificationGate>
 *   <YourProtectedComponent />
 * </VerificationGate>
 */
export default function VerificationGate({ children, showBanner = true }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState(null);

  useEffect(() => {
    checkVerification();
  }, []);

  const checkVerification = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get(`${API_URL}/verification/require-check`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      setIsVerified(response.data.can_access);
      setVerificationStatus(response.data.verification_status);
    } catch (err) {
      console.error('Verification check failed:', err);
      if (err.response?.status === 401) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  // User is verified - show content
  if (isVerified) {
    return children;
  }

  // User is not verified - show verification required screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Shield className="w-10 h-10 text-yellow-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Требуется верификация
        </h1>
        
        <p className="text-gray-600 mb-6">
          Для доступа к этой функции необходимо подтвердить свою личность и возраст (18+).
        </p>

        {showBanner && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 flex items-start gap-3 text-left">
            <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-yellow-800 font-medium text-sm">Почему это важно?</p>
              <p className="text-yellow-700 text-sm">
                Верификация защищает всех пользователей от мошенников и ботов, 
                обеспечивая безопасное пространство для знакомств.
              </p>
            </div>
          </div>
        )}

        {verificationStatus === 'pending' && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <p className="text-blue-700 text-sm">
              Ваша верификация находится в процессе. Пожалуйста, подождите.
            </p>
          </div>
        )}

        <button
          onClick={() => navigate('/verification')}
          className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white py-3 rounded-xl font-semibold hover:opacity-90 transition flex items-center justify-center gap-2"
        >
          Пройти верификацию
          <ArrowRight className="w-5 h-5" />
        </button>

        <button
          onClick={() => navigate('/dashboard')}
          className="mt-4 text-gray-500 hover:text-gray-700 transition text-sm"
        >
          Вернуться в личный кабинет
        </button>
      </div>
    </div>
  );
}

/**
 * Hook для проверки статуса верификации
 */
export function useVerificationStatus() {
  const [status, setStatus] = useState({
    loading: true,
    isVerified: false,
    verificationStatus: null,
    canAccess: false
  });

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          setStatus({
            loading: false,
            isVerified: false,
            verificationStatus: null,
            canAccess: false
          });
          return;
        }

        const response = await axios.get(`${API_URL}/verification/require-check`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        setStatus({
          loading: false,
          isVerified: response.data.can_access,
          verificationStatus: response.data.verification_status,
          canAccess: response.data.can_access
        });
      } catch (err) {
        setStatus({
          loading: false,
          isVerified: false,
          verificationStatus: 'error',
          canAccess: false
        });
      }
    };

    checkStatus();
  }, []);

  return status;
}
