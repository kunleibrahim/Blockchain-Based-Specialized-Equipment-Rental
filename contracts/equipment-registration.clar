;; Equipment Registration Contract
;; Records details of specialized machinery

(define-data-var last-equipment-id uint u0)

(define-map equipments
  { equipment-id: uint }
  {
    name: (string-ascii 100),
    description: (string-ascii 500),
    owner: principal,
    daily-rate: uint,
    deposit-amount: uint,
    is-available: bool
  }
)

(define-public (register-equipment
    (name (string-ascii 100))
    (description (string-ascii 500))
    (daily-rate uint)
    (deposit-amount uint))
  (let ((new-id (+ (var-get last-equipment-id) u1)))
    (begin
      (var-set last-equipment-id new-id)
      (map-set equipments
        { equipment-id: new-id }
        {
          name: name,
          description: description,
          owner: tx-sender,
          daily-rate: daily-rate,
          deposit-amount: deposit-amount,
          is-available: true
        }
      )
      (ok new-id)
    )
  )
)

(define-read-only (get-equipment (equipment-id uint))
  (map-get? equipments { equipment-id: equipment-id })
)

(define-public (update-availability (equipment-id uint) (is-available bool))
  (let ((equipment (unwrap! (get-equipment equipment-id) (err u1))))
    (if (is-eq tx-sender (get owner equipment))
      (begin
        (map-set equipments
          { equipment-id: equipment-id }
          (merge equipment { is-available: is-available })
        )
        (ok true)
      )
      (err u2)
    )
  )
)
