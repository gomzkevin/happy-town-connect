import * as React from 'npm:react@18.3.1'

interface QuotePDFProps {
  customerName: string
  email: string
  phone?: string
  eventDate?: string
  childrenCount?: number
  location?: string
  companyName: string
  companyEmail: string
  companyPhone?: string
  companyAddress?: string
  services: Array<{
    name: string
    price: number
    quantity: number
  }>
  totalEstimate: number
  termsConditions?: string
  quoteNumber: string
  createdDate: string
}

export const QuotePDF = ({
  customerName,
  email,
  phone,
  eventDate,
  childrenCount,
  location,
  companyName,
  companyEmail,
  companyPhone,
  companyAddress,
  services,
  totalEstimate,
  termsConditions,
  quoteNumber,
  createdDate,
}: QuotePDFProps) => (
  <html>
    <head>
      <meta charSet="utf-8" />
      <title>Cotización {quoteNumber}</title>
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Helvetica', 'Arial', sans-serif;
          font-size: 14px;
          line-height: 1.6;
          color: #333;
          background: #fff;
        }
        
        .container {
          max-width: 800px;
          margin: 0 auto;
          padding: 40px;
        }
        
        .header {
          text-align: center;
          margin-bottom: 40px;
          padding-bottom: 20px;
          border-bottom: 3px solid #ff6b6b;
        }
        
        .logo {
          font-size: 32px;
          font-weight: bold;
          color: #ff6b6b;
          margin-bottom: 10px;
        }
        
        .quote-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
        }
        
        .quote-number {
          font-size: 18px;
          font-weight: bold;
          color: #ff6b6b;
        }
        
        .quote-date {
          color: #666;
        }
        
        .section {
          margin-bottom: 30px;
        }
        
        .section-title {
          font-size: 18px;
          font-weight: bold;
          color: #333;
          margin-bottom: 15px;
          padding-bottom: 5px;
          border-bottom: 1px solid #eee;
        }
        
        .two-column {
          display: flex;
          gap: 40px;
        }
        
        .column {
          flex: 1;
        }
        
        .info-row {
          margin-bottom: 10px;
        }
        
        .info-label {
          font-weight: bold;
          display: inline-block;
          width: 120px;
        }
        
        .services-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
        }
        
        .services-table th,
        .services-table td {
          padding: 12px;
          text-align: left;
          border-bottom: 1px solid #eee;
        }
        
        .services-table th {
          background-color: #f8f9fa;
          font-weight: bold;
          color: #333;
        }
        
        .services-table .quantity {
          text-align: center;
        }
        
        .services-table .price {
          text-align: right;
          font-weight: bold;
        }
        
        .total-row {
          background-color: #ff6b6b;
          color: white;
          font-weight: bold;
          font-size: 16px;
        }
        
        .total-row td {
          border-bottom: none;
          padding: 15px 12px;
        }
        
        .terms {
          background-color: #f8f9fa;
          padding: 20px;
          border-radius: 5px;
          font-size: 12px;
          line-height: 1.5;
          color: #666;
        }
        
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #eee;
          text-align: center;
          color: #666;
          font-size: 12px;
        }
        
        @media print {
          body { -webkit-print-color-adjust: exact; }
          .container { padding: 20px; }
        }
      `}</style>
    </head>
    <body>
      <div className="container">
        <div className="header">
          <div className="logo">{companyName}</div>
          <p>Entretenimiento Infantil Premium</p>
        </div>

        <div className="quote-info">
          <div>
            <div className="quote-number">Cotización #{quoteNumber}</div>
            <div className="quote-date">Fecha: {createdDate}</div>
          </div>
          <div>
            <div><strong>Para:</strong> {customerName}</div>
            <div>{email}</div>
            {phone && <div>{phone}</div>}
          </div>
        </div>

        <div className="two-column">
          <div className="column">
            <div className="section">
              <h2 className="section-title">Datos del Cliente</h2>
              <div className="info-row">
                <span className="info-label">Nombre:</span>
                {customerName}
              </div>
              <div className="info-row">
                <span className="info-label">Email:</span>
                {email}
              </div>
              {phone && (
                <div className="info-row">
                  <span className="info-label">Teléfono:</span>
                  {phone}
                </div>
              )}
            </div>
          </div>

          <div className="column">
            <div className="section">
              <h2 className="section-title">Datos del Evento</h2>
              {eventDate && (
                <div className="info-row">
                  <span className="info-label">Fecha:</span>
                  {eventDate}
                </div>
              )}
              {childrenCount && (
                <div className="info-row">
                  <span className="info-label">Niños:</span>
                  {childrenCount}
                </div>
              )}
              {location && (
                <div className="info-row">
                  <span className="info-label">Ubicación:</span>
                  {location}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="section">
          <h2 className="section-title">Servicios Cotizados</h2>
          <table className="services-table">
            <thead>
              <tr>
                <th>Servicio</th>
                <th className="quantity">Cantidad</th>
                <th className="price">Precio Unit.</th>
                <th className="price">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {services.map((service, index) => (
                <tr key={index}>
                  <td>{service.name}</td>
                  <td className="quantity">{service.quantity}</td>
                  <td className="price">${service.price.toLocaleString()}</td>
                  <td className="price">${(service.price * service.quantity).toLocaleString()}</td>
                </tr>
              ))}
              <tr className="total-row">
                <td colSpan={3}>TOTAL ESTIMADO</td>
                <td className="price">${totalEstimate.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {termsConditions && (
          <div className="section">
            <h2 className="section-title">Términos y Condiciones</h2>
            <div className="terms">
              {termsConditions}
            </div>
          </div>
        )}

        <div className="section">
          <h2 className="section-title">Información de Contacto</h2>
          <div className="two-column">
            <div className="column">
              <div className="info-row">
                <span className="info-label">Email:</span>
                {companyEmail}
              </div>
              {companyPhone && (
                <div className="info-row">
                  <span className="info-label">Teléfono:</span>
                  {companyPhone}
                </div>
              )}
            </div>
            <div className="column">
              {companyAddress && (
                <div className="info-row">
                  <span className="info-label">Dirección:</span>
                  {companyAddress}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="footer">
          <p>Esta cotización es válida por 30 días desde la fecha de emisión.</p>
          <p>¡Gracias por confiar en {companyName} para tu evento especial!</p>
        </div>
      </div>
    </body>
  </html>
)

export default QuotePDF