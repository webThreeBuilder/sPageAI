"use client"

import { cn } from "@/lib/utils"
import { motion, stagger, useAnimate, useInView } from "framer-motion"
import { useEffect } from "react"

export const TypewriterEffect = ({
  words,
  className,
}: {
  words: string
  className?: string
}) => {
  const [scope, animate] = useAnimate()
  const isInView = useInView(scope)
  
  useEffect(() => {
    if (isInView) {
      animate(
        "span",
        {
          opacity: 1,
        },
        {
          duration: 2,
          delay: stagger(0.1),
        }
      )
    }
  }, [isInView, animate])

  const letters = words.split("")
  
  return (
    <motion.div
      ref={scope}
      className={cn("", className)}
    >
      {letters.map((letter, idx) => (
        <motion.span
          initial={{ opacity: 0 }}
          key={`${letter}-${idx}`}
        >
          {letter}
        </motion.span>
      ))}
    </motion.div>
  )
}