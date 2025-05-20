// components/Box.js
export default function Box({ title, description, icon }) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition duration-300 ease-in-out">
        {icon && <div className="mb-4 text-blue-500">{icon}</div>}
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </div>
    );
  }
  